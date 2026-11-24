# InfraPulse Dashboard 

**Repository 3 of 3.** The frontend is the part of the application visible in the browser. React builds the user interface (UI), TypeScript adds types to JavaScript, CSS controls the design, and Vite provides a local development server and build tool. Nginx is an optional static web server; it is not required for the first run.

## Understanding the project from scratch

InfraPulse is a server monitoring application. The database stores data, the backend reads and writes data, and the frontend displays data in the browser. The agent sends CPU (processor usage), RAM (memory usage), and disk (storage usage) metrics.

```text
Agent --> FastAPI --> PostgreSQL
Browser --> React/Vite --> FastAPI --> PostgreSQL
```

| Order | Repository | Port | Purpose |
|---|---|---|---|
| 1 | infrapulse-database | 5432 | Data storage |
| 2 | infrapulse-query-service | 8000 | API |
| 3 | infrapulse-query-service (agent) | No listening port | Sends metrics |
| 4 | infrapulse-dashboard | 5173 | Browser UI |

**Important:** This guide uses the Bash terminal on Ubuntu 24.04 / Ubuntu WSL as the primary environment. Native Windows instructions are also provided below. If you use WSL, install the database, Python, and Node.js inside WSL; do not mix Windows and WSL commands. Internet access is required for initial software installation. `localhost` means your own computer. A port is a numbered connection point for a service. Copy only the commands from the code blocks, not the output or terminal prompt. Run the next command only after the previous one succeeds.

### Folder setup

Extract all three ZIP files into the same `InfraPulse` folder. On Ubuntu/WSL, this guide assumes the path is `~/InfraPulse`. The `~` symbol represents your home directory. If the ZIP files are in Downloads, use the file manager to extract them into the InfraPulse folder in your home directory. In WSL, `explorer.exe .` opens the current Linux folder in Windows Explorer.

```bash
mkdir -p ~/InfraPulse
cd ~/InfraPulse
pwd
ls -a
```

`mkdir -p` creates a directory without raising an error if it already exists, `cd` changes the current directory, `pwd` displays the current path, and `ls -a` lists the contents, including hidden files. After extraction, the folder structure should look like this:

```text
InfraPulse/
  infrapulse-database/
  infrapulse-query-service/
  infrapulse-dashboard/
```

On native Windows, use `$HOME\InfraPulse` in PowerShell instead of `C:\Users\YOUR_NAME\InfraPulse`. Use Extract All to extract the ZIP files into this folder. Avoid creating duplicate nested folders.

## 1. Check whether the first two repositories are running

Open http://localhost:8000/health/ready in your browser. The expected response is `{"status":"ready"}`. At http://localhost:8000/api/v1/servers, you should see a JSON array containing demo servers. If not, follow the database and backend README files. Check the agent terminal for HTTP 201 logs. The frontend does not connect directly to the database.

## 2. Install Node.js (Terminal 4)

Node.js 22 LTS is the recommended version for this guide. For Ubuntu/WSL, visit the official https://nodejs.org/en/download page, select Node.js 22, and follow the Linux installation instructions. For native Windows, download and run the Node.js 22 Windows installer from the same page, then open a new PowerShell terminal. npm is included with Node.js. Verify the installation:

```bash
node --version
npm --version
```

The expected Node.js version is `v22.x.x`, along with an npm version number. If you receive a command-not-found error, check the installation and PATH. Avoid using an older Node.js version supplied by the Ubuntu distribution.

## 3. Open the dashboard folder and install packages

```bash
cd ~/InfraPulse/infrapulse-dashboard
ls -a
npm install
```

In Windows PowerShell, use `cd "$HOME\InfraPulse\infrapulse-dashboard"` and `Get-ChildItem -Force`; the npm command remains the same. If the PowerShell script execution policy blocks npm.ps1, use `npm.cmd install` and subsequently `npm.cmd run dev` / `npm.cmd run build`.

`package.json` lists the dependencies and scripts. `npm install` downloads the dependencies and creates the `node_modules` folder and `package-lock.json`. Internet access is required. Do not upload `node_modules` to GitHub. You can commit the lockfile after a successful installation. Review any audit warnings; do not blindly run `npm audit fix --force`.

## 4. Start the frontend

```bash
npm run dev
```

This runs the dev script defined in package.json. The expected Vite output includes `Local: http://127.0.0.1:5173/` or a similar localhost URL. Open http://localhost:5173 in your browser. If the port is busy, open the actual URL printed by Vite. Keep this terminal running. If you use VS Code, you can open a separate terminal using Terminal > New Terminal.

### How many terminals are running now?

| Terminal | Process | Can it be closed? |
|---|---|---|
| 1 | PostgreSQL service setup | You may exit the SQL shell; keep the service running |
| 2 | Uvicorn API | No |
| 3 | Demo or real agent | No |
| 4 | Vite dashboard | No |

## 5. What to look for in the dashboard

- API connected: Data is being received from the backend.
- Total servers: The database inventory count. A fresh demo has 3 servers; manual tests may add more servers.
- Online: The latest sample is recent and resource usage is below the threshold.
- Warning: At least one resource in a recent sample has usage of 85% or higher (default).
- Offline: The sample is missing or older than 120 seconds.
- Average CPU: The mean CPU usage of reporting servers; offline servers are excluded.
- Resource utilization: Select a server from the dropdown and choose 1h/6h/24h/7 days. Up to the latest 2,000 points are displayed.
- Server inventory: Search by hostname or region; click a hostname to display that server's graph.
- Resource alerts: Use the Include resolved checkbox to view recovered alerts.
- Refresh / Pause polling: Refresh manually or pause/resume the automatic 10-second refresh.

The demo-db-01 server has 91% disk usage, so a warning is expected. If you stop the demo agent and wait more than 120 seconds, the demo servers may appear offline. Restart the agent to receive fresh data. Actual values vary according to the synthetic demo data.

## 6. How does data travel through the application?

`src/api.ts` fetches the relative URL `/api/v1/servers`. `vite.config.ts` forwards `/api` requests to `http://localhost:8000` using a reverse proxy. FastAPI retrieves data from PostgreSQL and returns JSON. React updates its state and renders the UI. The database password is not provided to the browser. Because of this proxy, CORS configuration is not required for local development.

## 7. Purpose of each file

| File | Purpose |
|---|---|
| src/App.tsx | UI, cards, graph, server table, alerts, and polling |
| src/api.ts | TypeScript data types and API fetch function |
| src/main.tsx | Mounts the React application into the HTML root |
| src/style.css | Colors, spacing, and responsive layout |
| index.html | Browser page entry point |
| package.json | npm dependencies and scripts |
| tsconfig.json | TypeScript compiler settings |
| vite.config.ts | Development server API proxy |
| nginx.conf | Optional web server configuration |
| .gitignore, LICENSE, README.md | Git exclusions, license, and guide |

## 8. Production build (optional)

Open a new terminal and run the following commands from the dashboard folder:

```bash
npm run build
ls dist
```

The build script first checks TypeScript using `tsc --noEmit`, then creates optimized static files using `vite build`. The expected output includes `dist/index.html` and the `dist/assets/` directory. On Windows, use `Get-ChildItem dist`. The build output is not an API server. Do not treat `npm run preview` as a substitute for complete backend integration; production serving requires proxy configuration.

### Optional Nginx (Ubuntu/WSL only)

Vite is sufficient for local practice. If you want to try Nginx, keep the backend running on port 8000 and run these commands after building the frontend:

```bash
sudo apt update
sudo apt install -y nginx
sudo mkdir -p /var/www/infrapulse
sudo cp -r dist/. /var/www/infrapulse/
sudo cp nginx.conf /etc/nginx/sites-available/infrapulse
sudo ln -s /etc/nginx/sites-available/infrapulse /etc/nginx/sites-enabled/infrapulse
sudo nginx -t
sudo service nginx start
sudo service nginx reload
```

`mkdir` creates the web root, `cp` copies the built files and configuration, and `ln -s` enables the configuration (if the link already exists, verify it). `nginx -t` checks the configuration syntax; reload only if this check succeeds. Open http://localhost:8080 in your browser. The included configuration proxies `/api/` requests to 127.0.0.1:8000. The sample configuration listens on all interfaces. For a strictly local lab, change `listen 8080;` to `listen 127.0.0.1:8080;` in the copied configuration before enabling it. Do not expose it to the public internet; the API read endpoints are not authenticated. If Nginx conflicts with the default site on port 80, review the service logs rather than deleting unrelated configuration.

## 9. Common errors

| Error | Solution |
|---|---|
| npm not found | Check the Node.js installation and PATH |
| package.json not found | Use `cd` to enter the correct dashboard root directory |
| API unavailable / 503 | Check the backend health URL and database service |
| ECONNREFUSED | Verify that the API is running on port 8000 and check the Vite proxy configuration |
| Blank screen | Check the browser console (F12) and Vite terminal errors |
| No servers | Start the demo agent / verify the database seed data |
| Port in use | Open the URL printed by Vite; keep backend port 8000 unchanged |
| npm network error | Check internet, proxy, or registry access and retry installation |

## 10. Daily startup and shutdown (no need to repeat installation)

After restarting your computer on Ubuntu/WSL:

**Terminal 1**
```bash
sudo service postgresql start
pg_isready -h localhost -p 5432
```

**Terminal 2**
```bash
cd ~/InfraPulse/infrapulse-query-service
source .venv/bin/activate
python -m uvicorn app.main:app --env-file .env --host 127.0.0.1 --port 8000
```

**Terminal 3**
```bash
cd ~/InfraPulse/infrapulse-query-service
source .venv/bin/activate
python -c "from dotenv import load_dotenv; load_dotenv(); from agent.demo import main; main()"
```

**Terminal 4**
```bash
cd ~/InfraPulse/infrapulse-dashboard
npm run dev
```

On native Windows, check that PostgreSQL is running in the Services app. For the backend and agent commands, use the PowerShell paths and executables described in their respective README files. Open http://localhost:5173 in your browser. You do not need to repeat database creation, seed data insertion, pip install, or npm install every day. To stop the application, press Ctrl+C in the Vite, agent, and API terminals, in that order. Optionally, stop the local PostgreSQL service using `sudo service postgresql stop` only if no other application is using it. Data will persist in the database. If you used Nginx, you may optionally run `sudo service nginx stop`.

## 11. Final acceptance checklist

- [ ] Verified the 3 database tables and demo rows.
- [ ] Confirmed API readiness and Swagger accessibility.
- [ ] Confirmed that the agent sends samples with HTTP 201 responses.
- [ ] Confirmed that the dashboard is connected to the API and displays server data.
- [ ] Completed the manual high CPU and recovery test successfully.
- [ ] Completed the optional npm run build successfully.
- [ ] Captured an actual dashboard screenshot and pushed the source code to GitHub without exposing secrets.

## Upload to GitHub (optional for running the application)

On Ubuntu, install Git using `sudo apt install -y git`. On Windows, install Git from https://git-scm.com/downloads. Verify using `git --version`. Create a new repository on GitHub.com using the exact name of this repository. Do not initialize it with a README or license. Check for secrets before making it public.

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
git init -b main
git add .
git status --short
git commit -m "Initial InfraPulse project"
git remote add origin https://github.com/YOUR_USERNAME/infrapulse-dashboard.git
git push -u origin main
```

Run these commands **inside the root folder of this repository**. Replace `YOUR_USERNAME` with your GitHub username and use this repository's name for `REPO_NAME` where applicable. `git init` creates a local repository, `add` stages files, `status` lets you review them, `commit` creates a snapshot, `remote` connects the GitHub URL, and `push` uploads the code. For HTTPS authentication, use Git Credential Manager/browser login or a GitHub token, not your account password. Do not upload `.env`, database dumps, `.venv`, `node_modules`, or `dist`; `.gitignore` excludes these. If you see a secret in `git status`, remove it before committing. If a remote already exists, check `git remote -v`; do not blindly initialize or push again.

## Verification note

The commands were reviewed against the source configuration. Live database testing, dependency installation, and end-to-end browser testing were not performed in the packaging environment. The expected results described in this guide are acceptance checks, not actual test results. Local lab credentials are examples. Configure authentication, HTTPS, and secure secrets before allowing public access.
