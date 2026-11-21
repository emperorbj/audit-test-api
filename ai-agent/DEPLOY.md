# Deploy the agent to AWS Lambda

This guide assumes the **backend is already deployed** (see `backend/DEPLOY.md`). We reuse the
same AWS account, the same `github-deploy` user and the same GitHub secrets.

## What we're building

One container image, used by **two** Lambda functions:

| Function | What it runs | Who calls it |
|---|---|---|
| `audit-mcp` | The MCP server (the agent's tools) | the agent |
| `audit-agent` | The agent API (`POST /ask`) | the backend (for now: you, to test) |

```
          POST /ask + user token
you ───────────────────────────► audit-agent ──(tool calls + user token)──► audit-mcp
(later: the backend)                 │                                         │
                                     ▼                                         ▼
                                 Claude API                            backend (audit-backend)
```

It's the same setup as on your laptop (MCP server on 8002, agent API on 8001), except that each
part now has its own HTTPS address.

Total time: about 30 minutes.

> **Do everything in the same region as the backend** (top right of the AWS console).

---

## Part 1: Create the image storage (ECR repository), about 2 minutes

1. AWS console → search **ECR** → **Create repository**
2. **Repository name:** `audit-agent` (exactly this)
3. Leave everything else as is → **Create**

**✅ Check:** ECR shows two repositories, `audit-backend` and `audit-agent`.

---

## Part 2: Let GitHub deploy the agent, about 3 minutes

The `github-deploy` user may only touch the backend so far. Give it a second policy for the agent.

1. **IAM** → **Users** → **`github-deploy`** → **Permissions** tab → **Add permissions** →
   **Create inline policy**
2. Click **JSON**, delete everything, and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PushAgentImages",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": "arn:aws:ecr:REGION:ACCOUNT_ID:repository/audit-agent"
    },
    {
      "Sid": "UpdateTheAgentFunctions",
      "Effect": "Allow",
      "Action": [
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:UpdateFunctionCode"
      ],
      "Resource": [
        "arn:aws:lambda:REGION:ACCOUNT_ID:function:audit-agent",
        "arn:aws:lambda:REGION:ACCOUNT_ID:function:audit-mcp"
      ]
    }
  ]
}
```

3. Replace the 3 `REGION` and the 3 `ACCOUNT_ID` (same values as in the backend policy).
4. **Next** → **Policy name:** `deploy-audit-agent` → **Create policy**

(Logging in to ECR is already allowed by the backend policy.)

**✅ Check:** `github-deploy` now has two policies: `deploy-audit-backend` and `deploy-audit-agent`.

---

## Part 3: Push the code, about 5 minutes

The agent work is on the branch `agent-api`. The deploy workflow only runs from `main`, so merge it.

1. Terminal:
   ```bash
   cd "/Users/USER/Desktop/ai agents/audit-project"
   git ls-files | grep -E "\.env$" || echo "OK: no .env files"
   ```
   It must print **`OK: no .env files`**. Otherwise **stop** and tell me.
2. Merge and push:
   ```bash
   git switch main
   git merge agent-api
   git push
   ```
3. GitHub → your repo → **Actions** → click the run **Deploy agent** (about 5 minutes).
   The last step says *"Lambda function 'audit-mcp' doesn't exist yet..."* twice (once for each
   function). That's expected the first time.

**✅ Check:** the run is green ✅, and **ECR → `audit-agent`** shows an image tagged `latest`.

---

## Part 4: Create the MCP server function (`audit-mcp`), about 7 minutes

### 4.1 Create it
1. **Lambda** → **Create function** → **Container image**
2. Fill in:
   - **Function name:** `audit-mcp` (exactly this)
   - **Container image URI:** **Browse images** → `audit-agent` → image tagged **`latest`** → **Select image**
   - **Architecture:** **x86_64**
3. Open **Container image overrides** (below the image URI):
   - **CMD:** `python,-m,app.mcp_server.server`

   (The image starts the agent API by default. This tells this function to start the MCP server
   instead. The commas separate the words of the command.)
4. **Create function**

### 4.2 Configure it (Configuration tab)
- **General configuration** → **Edit** → Memory **`512`** MB → Timeout **0 min 30 sec** → **Save**
- **Environment variables** → **Edit** → add three:

  | Key (exactly) | Value |
  |---|---|
  | `BACKEND_URL` | your backend's Function URL **without** the `/` at the end |
  | `MCP_HOST` | `0.0.0.0` |
  | `MCP_PORT` | `8000` |

  `MCP_HOST=0.0.0.0` lets requests coming through the Function URL in. On your laptop it stays
  `127.0.0.1`. `MCP_PORT=8000` is the port the Lambda adapter forwards requests to.

- **Function URL** → **Create function URL** → Auth type **NONE** → **Save**. Copy the URL.

> Why NONE is OK here: every tool needs a valid user token, and the MCP server only passes
> requests on to the backend, which checks that token. This function adds no new access.

### 4.3 Test it
Browser: `<audit-mcp Function URL>mcp` (the first request may take a few seconds, a *cold start*).
You should see a short JSON error such as *"Not Acceptable: Client must accept text/event-stream"*.
**That's good:** the MCP server is running. It only answers real MCP clients, not browsers.

**✅ Check:** you see that JSON error, not `Internal Server Error` or a timeout.

---

## Part 5: Create the agent function (`audit-agent`), about 7 minutes

### 5.1 Create it
1. **Lambda** → **Create function** → **Container image**
2. **Function name:** `audit-agent`, **image:** `audit-agent` / **`latest`**, **Architecture:** **x86_64**.
   **No** CMD override this time.
3. **Create function**

### 5.2 Configure it
- **General configuration** → **Edit** → Memory **`1024`** MB → Timeout **5 min 0 sec** → **Save**

  (One agent run may take up to 4 minutes. Our code stops it there. The extra minute leaves time
  for the citation check.)

- **Environment variables** → **Edit** → add three:

  | Key (exactly) | Value |
  |---|---|
  | `ANTHROPIC_API_KEY` | your Anthropic API key (the one in your `.env`) |
  | `BACKEND_URL` | your backend's Function URL **without** the `/` at the end |
  | `MCP_SERVER_URL` | your `audit-mcp` Function URL **plus `mcp`**, e.g. `https://abc.lambda-url.us-east-1.on.aws/mcp` |

  Optional: `ANTHROPIC_MODEL` if you want a model other than the default `claude-opus-5-5`.

- **Function URL** → **Create function URL** → Auth type **NONE** → **Save**. Copy the URL.

> ⚠️ **NONE is temporary.** Our code still requires a valid user token, but right now any logged-in
> user (even a Viewer) could call the agent directly and skip the backend's role check, which
> costs Claude tokens. In a later step we switch this to **AWS_IAM**, so that only the backend
> can call it.

**✅ Check:** 3 environment variables, timeout 5 min, and a Function URL is shown.

---

## Part 6: Test it

1. Browser: `<audit-agent Function URL>health` should show `{"status":"ok"}`
2. Browser: `<backend Function URL>docs` → **POST /auth/login** →
   `{"email": "investigator@acme.test", "password": "Password123!"}` → copy `access_token`
3. Browser: `<audit-agent Function URL>docs` → **Authorize** 🔒 → paste the token →
   **POST /ask** → **Try it out** → `{"question": "Who deleted customer records yesterday?"}` →
   **Execute**. Wait 20-60 seconds.

**✅ Check:** you get `200` with an `answer` and `"citations": {"ok": true, ...}`.
**The agent is live.** 🎉

---

## Part 7: Deploying changes from now on

```bash
git add ai-agent
git commit -m "Describe your change"
git push
```

Both functions get the new image automatically. Changes outside `ai-agent/` don't redeploy the agent.
To deploy by hand: **Actions** → **Deploy agent** → **Run workflow**.

### Test the image on your laptop (optional, needs Docker Desktop running)
```bash
cd ai-agent
docker build -t audit-agent .
docker run --rm -p 8001:8000 --env-file .env audit-agent        # then open http://localhost:8001/health
```

---

## Part 8: When something goes wrong

Lambda → the function → **Monitor** → **View CloudWatch logs** → newest log stream → bottom.
**Copy the error and send it to me.**

| What you see | Fix |
|---|---|
| Actions: `not authorized to perform: ecr:...` or `lambda:...` | Part 2: check `REGION` / `ACCOUNT_ID` |
| Actions: `repository ... does not exist` | Part 1: name `audit-agent`, same region |
| `audit-mcp` logs show `Uvicorn running on http://0.0.0.0:8000`, but the URL times out | Part 4.2: `MCP_PORT` must be `8000` |
| `audit-mcp` returns `Invalid Host header` (421) | Part 4.2: `MCP_HOST` must be `0.0.0.0` |
| `audit-mcp` logs show the agent API starting instead (FastAPI) | Part 4.1: CMD override missing. Configuration → **Image** → **Edit** |
| `/ask` → 500, logs: `ANTHROPIC_API_KEY is not set` | Part 5.2: variable missing |
| `/ask` → 401 `Invalid or expired user token` | Log in again (tokens expire); check `BACKEND_URL` |
| `/ask` → answer says every tool failed / `Could not reach` | `MCP_SERVER_URL` must end in `/mcp`; `BACKEND_URL` on `audit-mcp` must be right |
| `Task timed out after 3.00 seconds` | The timeout wasn't saved (Part 4.2 / 5.2) |
| Logs: `exec format error` | Architecture must be **x86_64** |
