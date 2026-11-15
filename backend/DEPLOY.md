# Deploying the backend to AWS with GitHub: a beginner's step-by-step guide

This guide assumes you have never used AWS before. Follow the parts **in order**.
Each step says **where to click**, **what to type**, and **what you should see**.
Each part ends with a **✅ Check**. Don't move on until the check passes.

Expect about 60 minutes the first time. After that, deploying is just `git push`.

---

## Part 0: Understand what we're building

Our backend is a Python program. To run it on AWS:

1. **GitHub Actions** (a free robot on GitHub's servers) **builds a container image** every time
   you push backend code. A container image is a sealed box holding our code, Python, and every
   library it needs.
2. The robot **uploads the image to ECR** (Elastic Container Registry), AWS's storage for images.
3. The robot **tells Lambda to run the new image.** Lambda runs your code only when a request
   arrives: no server to manage, and you pay per request (free at our usage level).
4. A **Function URL** gives the API a public `https://...` address.

The database is **not** on AWS. It stays on **Neon**.

```
 You            GitHub                       AWS                                    Neon
┌────────┐ push ┌────────────────┐  image  ┌─────┐  run   ┌──────────────┐  SQL  ┌──────────┐
│git push│ ───► │ GitHub Actions │ ──────► │ ECR │ ─────► │ Lambda + URL │ ────► │ Postgres │
└────────┘      │ (builds image) │         └─────┘        └──────────────┘       └──────────┘
                └────────────────┘
```

**How does GitHub get permission to touch your AWS account?** Not with a password. You tell AWS
"trust login tokens from GitHub, but only from my repository `emperorbj/audit-test-api`". When the
robot runs, GitHub hands it a token proving where it comes from, and AWS gives it **temporary**
permissions (about 1 hour). This is called **OIDC**. Nothing secret is stored in GitHub, and you
install **no** GitHub App.

---

## Part 1: Get ready (about 10 minutes)

### 1.1 Sign in to AWS
1. Go to https://console.aws.amazon.com and sign in.
2. You see **Console Home**. The **search bar** at the top is how you'll open every service.

> Signing in with the email that created the account makes you the **root user**. That works
> for this guide. Later, AWS recommends creating an IAM user for daily work.

### 1.2 Set a spending alert (recommended, 3 minutes)
This setup should cost **$0 to a few cents a month**. An alert protects you anyway.
1. Search bar → **Budgets** → **AWS Budgets** → **Create budget**
2. **Use a template** → **Zero spend budget** → enter your email → **Create budget**

### 1.3 Choose your region
Your Lambda should be in the **same region as your Neon database** so they talk quickly.
1. Neon dashboard → your project → find the region, e.g. **AWS US East 1 (N. Virginia)** = `us-east-1`.
2. AWS Console, **top right**, click the region name and pick the **same** region.

> ⚠️ **Check the region (top right) at the start of every part.** Things created in one region are
> invisible in another.

### 1.4 Find your AWS account ID
Click your account name (top right). The menu shows **Account ID**, a 12-digit number like
`123456789012`. Copy it into your notes **without the dashes**.

### 1.5 Collect your values
Keep a notes file with:

| What | Where to find it |
|---|---|
| **Region** | Step 1.3, e.g. `us-east-1` |
| **Account ID** | Step 1.4, e.g. `123456789012` |
| **Pooled** Neon string | Neon → **Connect** → **Connection pooling ON** → copy (host has `-pooler`) |
| **Direct** Neon string | Same window → **Connection pooling OFF** → copy (no `-pooler`) |

> 🔒 The Neon strings contain your database password. Never share them or commit them.

**✅ Check:** your notes have the region, account ID and both Neon strings, and the console shows
the right region.

---

## Part 2: Create the image storage (ECR, about 3 minutes)

1. Search bar → **ECR** → **Elastic Container Registry**
2. Left menu → **Private registry → Repositories** → **Create repository**
   (or click **Create** / **Get started** on the welcome page)
3. **Repository name:** `audit-backend` (exactly this; the workflow uses this name)
4. Leave everything else → **Create**

**✅ Check:** the repository list shows `audit-backend`.

---

## Part 3: Tell AWS to trust GitHub (about 3 minutes)

This is done **once per AWS account**.

1. Search bar → **IAM** → open **IAM**
2. Left menu → **Identity providers** → **Add provider**
3. Fill in:
   - **Provider type:** **OpenID Connect**
   - **Provider URL:** `https://token.actions.githubusercontent.com`
   - **Audience:** `sts.amazonaws.com`
4. **Add provider**

**✅ Check:** the Identity providers list shows `token.actions.githubusercontent.com`.

---

## Part 4: Create the role GitHub will use (about 7 minutes)

A **role** is a named set of permissions. We create one that **only your repository's main branch**
can use, and that can **only** push images and update this one Lambda function.

### 4.1 Create the role
1. IAM → left menu → **Roles** → **Create role**
2. **Trusted entity type:** **Web identity**
3. Fill in:
   - **Identity provider:** `token.actions.githubusercontent.com`
   - **Audience:** `sts.amazonaws.com`
   - **GitHub organization:** `emperorbj`
   - **GitHub repository:** `audit-test-api`
   - **GitHub branch:** `main`
4. **Next**
5. **Add permissions** page: **don't select anything**, just click **Next**
   (we add exact permissions in 4.2)
6. **Role name:** `github-deploy-backend`
7. **Create role**

### 4.2 Give it exactly the permissions it needs
1. In the Roles list, click **`github-deploy-backend`**
2. **Permissions** tab → **Add permissions** → **Create inline policy**
3. Click the **JSON** button (top right of the editor)
4. Delete everything in the editor and paste this:

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

5. **Replace** the 2 `REGION` placeholders with your region (e.g. `us-east-1`) and the 2
   `ACCOUNT_ID` placeholders with your 12-digit account ID.
6. **Next** → **Policy name:** `deploy-audit-backend` → **Create policy**

### 4.3 Copy the role's ARN
An **ARN** is AWS's full ID for something. On the role's page, at the top under **Summary**, copy
the **ARN**. It looks like:
`arn:aws:iam::123456789012:role/github-deploy-backend`
Add it to your notes.

**✅ Check:** the role `github-deploy-backend` has one policy, `deploy-audit-backend`, and you
copied its ARN.

---

## Part 5: Give GitHub the two values it needs (about 3 minutes)

1. Open https://github.com/emperorbj/audit-test-api
2. **Settings** (top menu of the repo) → left menu **Secrets and variables** → **Actions**
3. Click the **Variables** tab (not Secrets: these values aren't secret) → **New repository variable**
4. Add two variables:

   | Name | Value |
   |---|---|
   | `AWS_ROLE_ARN` | the role ARN from Part 4.3 |
   | `AWS_REGION` | your region, e.g. `us-east-1` |

**✅ Check:** the Variables tab lists `AWS_ROLE_ARN` and `AWS_REGION`.

---

## Part 6: Push the code to GitHub (about 3 minutes)

The project folder is already a git repository with a first commit, connected to your GitHub
repo. You only need to push.

1. Open a terminal and go to the project folder:
   ```bash
   cd "/Users/USER/Desktop/ai agents/audit-project"
   ```
2. **Safety check:** make sure no secrets are included:
   ```bash
   git ls-files | grep -E "\.env$" || echo "OK: no .env files"
   ```
   It must print **`OK: no .env files`**. If it lists a file, **stop** and tell me.
3. Push:
   ```bash
   git push -u origin main
   ```
   If asked to log in, follow GitHub's prompt (browser login or a personal access token).

Pushing starts the deploy robot automatically.

4. Open the repo on GitHub → **Actions** tab → you see a run called **Deploy backend**. Click it
   to watch. It takes about 3-5 minutes. Steps turn green ✅ one by one.
   The last step says: *"Lambda function 'audit-backend' doesn't exist yet. Image pushed..."*.
   That's expected: we create the function next.

**✅ Check:** the run is green, and in AWS → **ECR → `audit-backend`** you see images tagged
`latest` and a long commit ID.

> **If the run fails at "Log in to AWS":** check Part 5 (variable names spelled exactly) and Part
> 4.1 (organization `emperorbj`, repository `audit-test-api`, branch `main`).

---

## Part 7: Create the Lambda function (about 5 minutes)

1. AWS search bar → **Lambda** → **Create function**
2. Choose **Container image** (third option at the top)
3. Fill in:
   - **Function name:** `audit-backend` (exactly this; the workflow uses this name)
   - **Container image URI:** **Browse images** → repository **`audit-backend`** → select the
     image tagged **`latest`** → **Select image**
   - **Architecture:** **x86_64** (the robot builds for x86_64)
   - **Permissions:** leave it as is (AWS creates a role that lets the function write logs)
4. **Create function**

**✅ Check:** a green banner says "Successfully created the function audit-backend".

---

## Part 8: Configure the function (about 5 minutes)

Click the **Configuration** tab. A menu appears on the left.

### 8.1 Memory and timeout
1. **General configuration** → **Edit**
2. **Memory:** **`1024`** MB (more memory also means more CPU; the password check needs it)
3. **Timeout:** **0 min 30 sec**
4. **Save**

### 8.2 Environment variables (the app's settings, like your `.env`)
1. **Environment variables** → **Edit** → **Add environment variable**, three times:

   | Key (exactly) | Value |
   |---|---|
   | `DATABASE_URL` | your **pooled** Neon string |
   | `DATABASE_URL_DIRECT` | your **direct** Neon string |
   | `JWT_SECRET` | a **new** random secret (see below) |

   **To make a secret**, run this in a terminal on your laptop and copy the output:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
   Use a **different** secret from the one in your local `.env`.
2. Check there are no spaces before or after any value → **Save**

### 8.3 Public web address (Function URL)
1. **Function URL** → **Create function URL**
2. **Auth type:** **NONE**. Anyone can *reach* the API, but our code still requires login for
   everything except `/health` and `/auth/login`.
3. **Save**, then copy the **Function URL** (like `https://abc123xyz.lambda-url.us-east-1.on.aws/`)
   into your notes.

**✅ Check:** Environment variables shows 3 keys, and Function URL shows a link.

---

## Part 9: Test it (about 5 minutes)

### 9.1 Health check
In a browser, open your Function URL + `health`:
`https://abc123xyz.lambda-url.us-east-1.on.aws/health`

**You should see:** `{"status":"ok","database":"ok"}`

> **The first request can take 5-10 seconds.** That's a *cold start*: Lambda is starting the
> container. Refresh, and it's fast.

### 9.2 Use the API
1. Open your Function URL + `docs`
2. **POST /auth/login** → **Try it out** →
   `{"email": "admin@acme.test", "password": "Password123!"}` → **Execute** → copy `access_token`
3. **Authorize** 🔒 (top right) → paste the token → **Authorize** → **Close**
4. **GET /audit-logs** → **Try it out** → **Execute**. You see audit events.

**✅ Check:** health is ok, and login and audit-log search work. **Your backend is live.** 🎉

---

## Part 10: Deploying changes from now on

Just commit and push changes inside `backend/`:

```bash
git add backend
git commit -m "Describe your change"
git push
```

GitHub → **Actions** tab → watch **Deploy backend**. When it's green, the new version is live.
The last step's log shows exactly which image (commit ID) was deployed.

- **Changes outside `backend/`** (like the future `ai-agent/` folder) do **not** redeploy the backend.
- **Deploy by hand** without a code change: **Actions** → **Deploy backend** → **Run workflow**.
- **Database model changes** (`models.py`): run the migration **from your laptop before pushing**:
  ```bash
  cd backend && uv run alembic upgrade head
  ```
  Lambda never changes the database structure.

---

## Part 11: When something goes wrong

### A GitHub Actions run fails (red ❌)
Click the run → click the red step → read the error at the bottom.

| Error in the step | Fix |
|---|---|
| "Log in to AWS": `Not authorized to perform sts:AssumeRoleWithWebIdentity` | Part 4.1: organization / repository / branch must be exactly `emperorbj` / `audit-test-api` / `main` |
| "Log in to AWS": `role-to-assume` empty, or region missing | Part 5: variables named exactly `AWS_ROLE_ARN` and `AWS_REGION` |
| "Build and push": `not authorized to perform: ecr:...` | Part 4.2: `REGION`/`ACCOUNT_ID` replaced correctly in the ECR line |
| `repository ... does not exist` | Part 2: ECR repo named exactly `audit-backend`, in the same region |
| "Point Lambda": `not authorized to perform: lambda:...` | Part 4.2: check the Lambda line of the policy |

### The API returns errors
Lambda → `audit-backend` → **Monitor** → **View CloudWatch logs** → newest log stream → scroll to
the bottom. **Copy the error and send it to me.**

| What you see | Fix |
|---|---|
| Logs: `Field required` + `database_url` / `jwt_secret` | Part 8.2: an environment variable is missing or misspelled |
| Logs: `exec format error` | Part 7: architecture must be **x86_64** |
| `{"Message":"Forbidden"}` | Part 8.3: Function URL auth type must be **NONE** |
| `Task timed out after 3.00 seconds` | Part 8.1: timeout **30 sec** |
| First request times out, the next works | Neon was asleep (normal); retry |
| Something seems to have disappeared | Wrong region selected, top right |

---

## Glossary

| Term | Meaning |
|---|---|
| **Region** | A physical AWS location (e.g. `us-east-1`). Resources live in one region. |
| **Container image** | A sealed package of code + Python + libraries that runs the same everywhere |
| **ECR** | AWS's private storage for container images |
| **Lambda** | Runs your code on demand; no server to manage; pay per request |
| **Function URL** | A public HTTPS address for a Lambda function |
| **Cold start** | The extra delay when Lambda starts the container after a quiet period |
| **IAM** | AWS's permissions system: who may do what |
| **Role** | A named set of permissions someone (or something) can temporarily use |
| **Policy** | A JSON document listing exactly which actions a role may do, on which resources |
| **ARN** | Amazon Resource Name: AWS's full ID for anything, e.g. `arn:aws:iam::123...:role/...` |
| **OIDC** | The trust link that lets GitHub get temporary AWS permissions without stored passwords |
| **GitHub Actions** | GitHub's free automation that runs our workflow file on each push |
| **Workflow** | The file `.github/workflows/deploy-backend.yml`: the robot's instructions |
| **Environment variable** | A named setting given to the app from outside the code (like `.env`) |
| **CloudWatch** | Where Lambda's logs (including errors) are stored |
