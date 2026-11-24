# InfraPulse — Dashboard UI

## Azure VM Deployment Guide (Nginx)

A step-by-step guide to build and host the **InfraPulse Dashboard** on an Azure Ubuntu VM using **Node.js**, **React**, **TypeScript**, **Vite**, and **Nginx**, with static hosting under `/var/www/html`.

The dashboard displays server health, CPU, memory and disk utilization, historical metrics, and resource alerts. It retrieves data from the InfraPulse Query Service (FastAPI), not directly from the database.

---

## Deployment Architecture

```text
Browser
   |
   | HTTP :80
   v
Azure Frontend VM (Nginx + React static files)
   |
   | Private HTTP :8000 (/api/ reverse proxy)
   v
Azure Backend VM (FastAPI Query Service)
   |
   | PostgreSQL :5432 (TLS)
   v
Azure Database for PostgreSQL Flexible Server
```

### Prerequisites

- An Azure Ubuntu VM for the dashboard (Ubuntu 24.04 LTS recommended).
- A public IP for the frontend VM and SSH access from your computer.
- A running InfraPulse Query Service on a separate backend VM, listening on port `8000` on its private network interface.
- Network connectivity between the frontend and backend VMs (for example, within the same Azure virtual network).
- A working database connection and metrics collector on the backend side.
- Your `infrapulse-dashboard` repository uploaded to GitHub.
- Outbound internet connectivity from the frontend VM for Git and npm downloads.

Deploy the database first, then the backend, and finally this dashboard. This guide assumes the first two components are already running.

Replace the following placeholders throughout the guide with your own values. Do not type the angle brackets literally.

| Placeholder | Meaning | Example |
|---|---|---|
| `<FRONTEND_PUBLIC_IP>` | Public IP of the dashboard VM | Your Azure VM public IP |
| `<BACKEND_PRIVATE_IP>` | Private IP of the Query Service VM | `10.0.2.4` |
| `<YOUR_GITHUB_USERNAME>` | Your GitHub account name | `your-username` |
| `azureuser` | VM SSH username | Change if you selected another username |

---

## 1. Open Port 80 in Azure NSG

To allow HTTP traffic to the dashboard:

1. Open the [Azure Portal](https://portal.azure.com/).
2. Navigate to **Virtual Machines** and select your frontend VM.
3. Open **Networking > Network settings**, or open its associated Network Security Group (NSG).
4. Under **Inbound port rules**, select **Add inbound rule** and enter:

   | Setting | Value |
   |---|---|
   | Source | IP Addresses — your laptop's public IP with `/32` |
   | Source port ranges | `*` |
   | Destination | Any |
   | Destination port ranges | `80` |
   | Protocol | TCP |
   | Action | Allow |
   | Priority | `1010` (or an unused priority before any matching deny rule) |
   | Name | `Allow-HTTP-80` |

5. Ensure port `22` (SSH) is also allowed from your laptop's public IP.
6. On the backend VM's NSG, allow TCP port `8000` from the frontend VM's private IP (for example, `10.0.1.4/32`). Do not expose port `8000` directly to the internet.

**Why?** An NSG controls which network connections are allowed to reach an Azure resource. Nginx listens on port 80 and communicates with FastAPI on port 8000 over the private network.

**Security:** Keep this deployment restricted to your IP. The current application's read APIs do not implement user authentication. Configure authentication and HTTPS before making the dashboard available publicly. Opening port 443 alone does not configure HTTPS.

---

## 2. Connect to the Azure VM

Open Git Bash, PowerShell, or a terminal on your local computer. Connect to the **frontend VM** using its public IP:

```bash
ssh azureuser@<FRONTEND_PUBLIC_IP>
```

If your VM uses an SSH private key stored outside the default SSH directory:

```bash
ssh -i /path/to/private-key azureuser@<FRONTEND_PUBLIC_IP>
```

Verify the server identity before accepting a first-time SSH host key. After login, run:

```bash
whoami
hostname
pwd
```

These commands display your username, VM hostname, and current directory. All remaining Linux commands in this guide must be executed on the frontend VM, not on your laptop or backend VM.

---

## 3. Install Node.js and npm (v22 LTS)

Update the Ubuntu package index and install the required utilities:

```bash
sudo apt update
sudo apt install -y curl git ca-certificates
```

Use Node.js 22, the version recommended for this InfraPulse project. Download the NodeSource setup script:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
```

Review the downloaded script before running it with administrator privileges:

```bash
less /tmp/nodesource_setup.sh
```

Press `q` to exit the viewer. Then run:

```bash
sudo bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs
```

Alternatively, follow the Linux instructions for Node.js 22 at [nodejs.org/en/download](https://nodejs.org/en/download).

Verify the installation:

```bash
node -v
npm -v
git --version
```

Expected: Node.js `v22.x.x` and valid npm and Git version numbers. npm is installed with Node.js and manages the frontend libraries.

---

## 4. Clone the Repository

Go to your home directory and clone your dashboard repository:

```bash
cd ~
git clone https://github.com/<YOUR_GITHUB_USERNAME>/infrapulse-dashboard.git
cd infrapulse-dashboard
ls -la
```

You should see `package.json`, `src/`, `index.html`, `vite.config.ts`, `nginx.conf`, and `README.md`.

If you have already cloned the repository, enter its directory instead and use `git pull --ff-only` to retrieve updates. Do not clone into an existing nonempty directory.

---

## 5. Verify the Backend API Endpoint

From the frontend VM, check whether the backend is reachable using its **private IP**. Replace the example IP below if your backend has a different address.

```bash
curl --fail --show-error http://10.0.2.4:8000/health/ready
```

Expected response:

```json
{"status":"ready"}
```

Check the server inventory endpoint:

```bash
curl --fail --show-error http://10.0.2.4:8000/api/v1/servers
```

Expected: a JSON array of servers (which may be empty if no metrics have been received).

### How InfraPulse connects to its API

Unlike the NextOps reference dashboard, InfraPulse uses relative API URLs. In `src/api.ts`, the fetch request is:

```typescript
fetch('/api/v1' + path, { signal, cache: 'no-store' });
```

For Azure deployment, Nginx forwards these `/api/` requests to the backend VM. Therefore:

- No frontend `.env` file or `VITE_API_BASE_URL` is required.
- No changes to `src/api.ts` or `vite.config.ts` are required.
- The backend does not need a public IP.
- Browser requests use the same origin as the dashboard, so no additional CORS configuration is needed for this setup.

If the readiness check fails, fix the backend service, database connectivity, or NSG rules before continuing.

---

## 6. Install Dependencies and Build

Inside `~/infrapulse-dashboard`, run:

```bash
npm install
```

This reads `package.json` and downloads React, TypeScript, Vite, and other dependencies into `node_modules`.

Create the production build:

```bash
npm run build
```

The build first checks TypeScript and then compiles the frontend into optimized static files under `dist/`.

Verify the build output:

```bash
ls -la dist
```

Expected: `index.html` and an `assets/` directory. If the build fails, resolve the reported errors before copying the files. The production deployment does not need `npm run dev` or a running Node.js server.

---

## 7. Install Nginx

Install and start the Nginx web server:

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo systemctl status nginx --no-pager
```

Expected service status: `active (running)`.

Nginx will serve the static React dashboard and forward API requests to the backend. Enabling the service makes it start automatically after a VM reboot.

---

## 8. Copy Build Artifacts to `/var/www/html`

Run these commands from the dashboard repository root:

```bash
cd ~/infrapulse-dashboard
sudo mkdir -p /var/www/html
sudo cp -r dist/. /var/www/html/
ls -la /var/www/html
```

The `dist/.` syntax copies all contents of the production build directory, including hidden entries if present. The web root must contain `index.html` and `assets/` directly, not an extra `dist` directory.

On a fresh, dedicated VM, the default Nginx placeholder file can optionally be removed:

```bash
sudo rm -f /var/www/html/index.nginx-debian.html
```

Do not delete an existing website or unrelated files from a shared server.

---

## 9. Configure Nginx Reverse Proxy

The repository's included `nginx.conf` is intended for local development-style hosting on port 8080 with a local backend. For this Azure deployment, create a site configuration using port 80, `/var/www/html`, and the backend VM's private IP.

```bash
sudo nano /etc/nginx/sites-available/infrapulse
```

Paste the following configuration. Replace `10.0.2.4` with the actual backend private IP if necessary:

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://10.0.2.4:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 20s;
    }

    location = /healthz {
        access_log off;
        return 200 'ok';
    }
}
```

Save and exit: `Ctrl+O`, `Enter`, then `Ctrl+X`.

| Directive | Purpose |
|---|---|
| `listen 80` | Accept HTTP requests on port 80 |
| `root /var/www/html` | Locate compiled frontend files |
| `try_files` | Serve existing assets or the React entry page |
| `location /api/` | Identify requests intended for FastAPI |
| `proxy_pass` | Forward requests to the backend, preserving the `/api/` path |
| `/healthz` | Check that the Nginx site is responding |

Enable the new site:

```bash
sudo ln -s /etc/nginx/sites-available/infrapulse /etc/nginx/sites-enabled/infrapulse
```

If the link already exists, verify it points to the intended configuration. On a fresh dedicated VM, disable the default site:

```bash
sudo unlink /etc/nginx/sites-enabled/default
```

If the default link is already absent, skip this command. On shared servers, review existing sites before changing them.

Test the configuration:

```bash
sudo nginx -t
```

Expected: `syntax is ok` and `test is successful`. Only if the test succeeds, reload Nginx:

```bash
sudo systemctl reload nginx
```

---

## 10. Test the Application

First, verify the web server and API proxy from the frontend VM:

```bash
curl --fail http://localhost/healthz
curl --fail http://localhost/api/v1/servers
```

Expected: `ok` for the first command and JSON data for the second.

Now open your local computer's browser and navigate to:

```text
http://<FRONTEND_PUBLIC_IP>
```

The InfraPulse Dashboard should load and display its API connection status, server inventory, CPU, memory and disk utilization, historical graphs, and resource alerts. Live updates require a running metrics collector on the backend side.

---

## 11. Troubleshooting

| Problem | What to check |
|---|---|
| Browser cannot connect | Azure public IP, frontend NSG port 80, Nginx service and any Ubuntu firewall |
| SSH connection fails | Public IP, SSH username/key and NSG port 22 |
| `npm install` fails | Node version, outbound network connectivity and package registry access |
| `npm run build` fails | TypeScript errors and installed dependencies |
| Default Nginx welcome page | Enabled site configuration and `/var/www/html/index.html` |
| `502 Bad Gateway` | Backend private IP, port 8000, backend process and NSG rules |
| `503 Service Unavailable` | Backend readiness and database connectivity |
| Dashboard shows API unavailable | `/api/` reverse proxy, browser developer tools (F12), Nginx logs |
| Servers show offline | Metrics collector is stopped or samples are stale |

Useful diagnostic commands on the frontend VM:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo journalctl -u nginx -n 50 --no-pager
sudo tail -n 50 /var/log/nginx/error.log
curl -v http://10.0.2.4:8000/health/ready
```

If Ubuntu's UFW firewall is active, also verify that it permits HTTP from your intended client. Do not disable network security just to resolve a connectivity problem.

---

## 12. Deploy Future Dashboard Updates

After pushing updated frontend code to GitHub, connect to the frontend VM and run:

```bash
cd ~/infrapulse-dashboard
git pull --ff-only
npm install
npm run build
sudo cp -r dist/. /var/www/html/
sudo nginx -t && sudo systemctl reload nginx
```

Run each command only after the previous one succeeds. For static-only changes, Nginx does not strictly require a reload, but the test and reload are useful when configuration has changed. Refresh the browser to verify the update.

---

## Final Deployment Checklist

- [ ] Database and backend are running.
- [ ] Backend readiness endpoint returns `ready` from the frontend VM.
- [ ] Frontend NSG allows HTTP and SSH from the authorized client IP.
- [ ] Node.js and npm are installed.
- [ ] Dashboard repository has been cloned.
- [ ] `npm install` and `npm run build` succeed.
- [ ] Static assets are present under `/var/www/html`.
- [ ] Nginx configuration passes `nginx -t`.
- [ ] Nginx is active and enabled.
- [ ] Dashboard opens in the browser and shows API data.
- [ ] Access is restricted until HTTPS and authentication are configured.

**Verification note:** This guide was prepared against the existing InfraPulse dashboard source and configuration. Expected outputs are acceptance checks, not evidence of a completed live Azure deployment. Azure VMs, disks and networking resources may incur charges.
