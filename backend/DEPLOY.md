# Deploying the backend to AWS with GitHub: a beginner's step-by-step guide

Follow the parts **in order**. Each step says **where to click**, **what to type**, and **what you
should see**. Each part ends with a **✅ Check**. Don't move on until it passes.

About 45 minutes the first time. After that, deploying is just `git push`.

---

## Part 0: What we're building

1. When you push backend code, **GitHub Actions** (a free robot on GitHub's servers) **builds a
   container image**: a sealed box with our code, Python and all libraries.
2. The robot **uploads the image to ECR**, AWS's storage for images.
3. The robot **tells Lambda to run the new image.** Lambda runs code only when a request arrives
   (no server to manage, free at our usage).
4. A **Function URL** gives the API a public `https://...` address.

The database stays on **Neon**.

```
 You            GitHub                       AWS                                    Neon
┌────────┐ push ┌────────────────┐  image  ┌─────┐  run   ┌──────────────┐  SQL  ┌──────────┐
│git push│ ───► │ GitHub Actions │ ──────► │ ECR │ ─────► │ Lambda + URL │ ────► │ Postgres │
└────────┘      │ (builds image) │         └─────┘        └──────────────┘       └──────────┘
                └────────────────┘
```

**How does GitHub get into your AWS account?** You create a special AWS user, `github-deploy`,
that can do only two things: upload images to `audit-backend` and update the `audit-backend`
function. GitHub keeps that user's **access key** (a username and password for programs) as an
encrypted **secret**.

---

## Part 1: Get ready (about 10 minutes)

### 1.1 Sign in
Go to https://console.aws.amazon.com and sign in. The **search bar** at the top opens every service.

### 1.2 Spending alert (recommended)
Search **Budgets** → **AWS Budgets** → **Create budget** → **Use a template** → **Zero spend
budget** → your email → **Create budget**. You'll get an email if anything ever costs money.

### 1.3 Choose your region
Use the **same region as your Neon database**.
1. Neon dashboard → your project → region, e.g. **AWS US East 1 (N. Virginia)** = `us-east-1`
2. AWS Console, **top right**: click the region name and pick the same one.

> ⚠️ **Check the region (top right) at the start of every part.** Things created in one region
> are invisible in another.

### 1.4 Find your AWS account ID
Click your account name (top right) and copy the **Account ID** (12 digits) **without dashes**,
e.g. `123456789012`.

### 1.5 Collect your values in a notes file

| What | Where |
|---|---|
| **Region** | 1.3, e.g. `us-east-1` |
| **Account ID** | 1.4 |
| **Pooled** Neon string | Neon → **Connect** → **Connection pooling ON** → copy (host has `-pooler`) |
| **Direct** Neon string | Same window → **Connection pooling OFF** → copy |

> 🔒 These strings contain your database password. Never share or commit them.

**✅ Check:** your notes have all four, and the console shows the right region.

---

## Part 2: Create the image storage (ECR, about 3 minutes)

1. Search **ECR** → **Elastic Container Registry**
2. **Private registry → Repositories** → **Create repository**
   (or **Create** / **Get started** on the welcome page)
3. **Repository name:** `audit-backend` (exactly this)
4. Leave everything else → **Create**

**✅ Check:** the list shows `audit-backend`.

---

## Part 3: Create the `github-deploy` user and its access key (about 7 minutes)

### 3.1 Create the user
1. Search **IAM** → **IAM** → left menu **Users** → **Create user**
2. **User name:** `github-deploy`
3. **Do not** tick "Provide user access to the AWS Management Console" (this user is for GitHub,
   not a person) → **Next**
4. **Set permissions** page: leave the defaults, select nothing → **Next** → **Create user**

### 3.2 Give it exactly the permissions it needs
1. Click the user **`github-deploy`** → **Permissions** tab → **Add permissions** →
   **Create inline policy**
2. Click **JSON** (top right of the editor), delete everything, and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LoginToECR",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "PushImages",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": "arn:aws:ecr:REGION:ACCOUNT_ID:repository/audit-backend"
    },
    {
      "Sid": "UpdateTheFunction",
      "Effect": "Allow",
      "Action": [
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:UpdateFunctionCode"
      ],
      "Resource": "arn:aws:lambda:REGION:ACCOUNT_ID:function:audit-backend"
    }
  ]
}
```

3. Replace the 2 `REGION` with your region (e.g. `us-east-1`) and the 2 `ACCOUNT_ID` with your
   12-digit account ID.
4. **Next** → **Policy name:** `deploy-audit-backend` → **Create policy**

### 3.3 Create the access key
1. Still on the `github-deploy` user → **Security credentials** tab → **Access keys** section →
   **Create access key**
2. **Use case:** choose **Application running outside AWS** → **Next** → (description optional)
   → **Create access key**
3. You see an **Access key** (starts with `AKIA...`) and a **Secret access key**.
   **Copy both now.** AWS shows the secret **only once**. (You can also click **Download .csv
   file**; delete that file after Part 4.)
4. **Done**

> 🔒 Treat the secret access key like a password: don't share it, don't commit it, don't paste
> it in chat. If it ever leaks, IAM → `github-deploy` → Security credentials → **Deactivate**
> and **Delete** the key, then create a new one.

**✅ Check:** `github-deploy` has one policy, `deploy-audit-backend`, and one access key, and you
have both key values.

---

## Part 4: Give GitHub the key and region (about 3 minutes)

1. Open https://github.com/emperorbj/audit-test-api
2. **Settings** → left menu **Secrets and variables** → **Actions**
3. **Secrets** tab → **New repository secret**. Add two (GitHub encrypts these and never shows them again):

   | Name | Value |
   |---|---|
   | `AWS_ACCESS_KEY_ID` | the access key (`AKIA...`) |
   | `AWS_SECRET_ACCESS_KEY` | the secret access key |

4. **Variables** tab → **New repository variable**. Add one:

   | Name | Value |
   |---|---|
   | `AWS_REGION` | your region, e.g. `us-east-1` |

5. If you downloaded the `.csv` file in Part 3.3, delete it now.

**✅ Check:** Secrets shows 2 entries, and Variables shows `AWS_REGION`.

---

## Part 5: Push the code to GitHub (about 3 minutes)

The project folder is already a git repository, connected to your GitHub repo. You only push.

1. Terminal:
   ```bash
   cd "/Users/USER/Desktop/ai agents/audit-project"
   ```
2. **Safety check** (no secrets included):
   ```bash
   git ls-files | grep -E "\.env$" || echo "OK: no .env files"
   ```
   It must print **`OK: no .env files`**. Otherwise **stop** and tell me.
3. Push:
   ```bash
   git push -u origin main
   ```
   If asked to log in, follow GitHub's prompt.
4. GitHub → your repo → **Actions** tab → click the run **Deploy backend** to watch (3-5 minutes).
   The last step says *"Lambda function 'audit-backend' doesn't exist yet. Image pushed..."*.
   That's expected for the first run.

**✅ Check:** the run is green ✅, and AWS → **ECR → `audit-backend`** shows images tagged
`latest` and a long commit ID.

---

## Part 6: Create the Lambda function (about 5 minutes)

1. Search **Lambda** → **Create function**
2. Choose **Container image** (third option at the top)
3. Fill in:
   - **Function name:** `audit-backend` (exactly this)
   - **Container image URI:** **Browse images** → `audit-backend` → image tagged **`latest`** →
     **Select image**
   - **Architecture:** **x86_64**
   - **Permissions:** leave as is (lets the function write logs)
4. **Create function**

**✅ Check:** green banner "Successfully created the function audit-backend".

---

## Part 7: Configure the function (about 5 minutes)

Open the **Configuration** tab; a menu appears on the left.

### 7.1 Memory and timeout
**General configuration** → **Edit** → Memory **`1024`** MB → Timeout **0 min 30 sec** → **Save**

### 7.2 Environment variables
**Environment variables** → **Edit** → **Add environment variable**, three times:

| Key (exactly) | Value |
|---|---|
| `DATABASE_URL` | your **pooled** Neon string |
| `DATABASE_URL_DIRECT` | your **direct** Neon string |
| `JWT_SECRET` | a **new** random secret (below) |

New secret, run on your laptop and copy the output:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```
No spaces around the values → **Save**

### 7.3 Function URL
**Function URL** → **Create function URL** → Auth type **NONE** → **Save**.
Copy the URL (like `https://abc123xyz.lambda-url.us-east-1.on.aws/`).

> Auth type NONE means anyone can *reach* the API. Our code still requires login for everything
> except `/health` and `/auth/login`.

**✅ Check:** 3 environment variables, and a Function URL is shown.

---

## Part 8: Test it

1. Browser: `<your Function URL>health` should show `{"status":"ok","database":"ok"}`
   (the first request can take 5-10 seconds while Lambda starts: a *cold start*)
2. Browser: `<your Function URL>docs`
   - **POST /auth/login** → **Try it out** →
     `{"email": "admin@acme.test", "password": "Password123!"}` → **Execute** → copy `access_token`
   - **Authorize** 🔒 → paste the token → **Authorize** → **Close**
   - **GET /audit-logs** → **Try it out** → **Execute**. You see audit events.

**✅ Check:** health ok, and login and search work. **Your backend is live.** 🎉

---

## Part 9: Deploying changes from now on

```bash
git add backend
git commit -m "Describe your change"
git push
```
Watch it in GitHub → **Actions**. When green, it's live.

- Changes **outside `backend/`** don't redeploy the backend.
- Deploy by hand: **Actions** → **Deploy backend** → **Run workflow**.
- Changed `models.py`? Run `cd backend && uv run alembic upgrade head` from your laptop **before** pushing.

---

## Part 10: When something goes wrong

### A GitHub Actions run fails (red ❌)
Click the run → the red step → read the error at the bottom.

| Error | Fix |
|---|---|
| "Log in to AWS": `Credentials could not be loaded` | Part 4: secret names must be exactly `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` |
| "Log in to AWS": `Region is missing` | Part 4: variable `AWS_REGION` (in **Variables**, not Secrets) |
| `The security token included in the request is invalid` | The key was pasted wrong or deleted; create a new key (Part 3.3) and update the secrets |
| `not authorized to perform: ecr:...` | Part 3.2: check `REGION` / `ACCOUNT_ID` in the ECR line |
| `repository ... does not exist` | Part 2: name `audit-backend`, same region as `AWS_REGION` |
| `not authorized to perform: lambda:...` | Part 3.2: check the Lambda line |

### The API returns errors
Lambda → `audit-backend` → **Monitor** → **View CloudWatch logs** → newest log stream → bottom.
**Copy the error and send it to me.**

| What you see | Fix |
|---|---|
| Logs: `Field required` + `database_url` / `jwt_secret` | Part 7.2: variable missing or misspelled |
| Logs: `exec format error` | Part 6: architecture must be **x86_64** |
| `{"Message":"Forbidden"}` | Part 7.3: auth type **NONE** |
| `Task timed out after 3.00 seconds` | Part 7.1: timeout **30 sec** |
| First request times out, the next works | Neon was asleep; retry |
| Something "disappeared" | Wrong region, top right |

---

## Glossary

| Term | Meaning |
|---|---|
| **Region** | A physical AWS location (e.g. `us-east-1`) |
| **Container image** | Code + Python + libraries in one sealed package |
| **ECR** | AWS's private storage for container images |
| **Lambda** | Runs your code on demand; pay per request |
| **Function URL** | A public HTTPS address for a Lambda function |
| **Cold start** | The extra delay when Lambda starts the container after a quiet period |
| **IAM** | AWS's permissions system: who may do what |
| **IAM user** | An identity in your account, here a "robot" user for GitHub |
| **Policy** | JSON listing exactly which actions are allowed, on which resources |
| **Access key** | A key ID + secret that lets a program act as an IAM user |
| **GitHub secret** | An encrypted value GitHub gives the workflow but never shows again |
| **GitHub Actions / workflow** | GitHub's automation; our instructions are in `.github/workflows/deploy-backend.yml` |
| **Environment variable** | A setting given to the app from outside the code (like `.env`) |
| **CloudWatch** | Where Lambda's logs and errors are stored |
