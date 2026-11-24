# InfraPulse Dashboard — Beginner Step-by-Step Guide (Hindi / Hinglish)

**Repository 3 of 3.** Frontend woh part hai jo browser mein dikhta hai. React UI banata hai, TypeScript JavaScript ke saath types provide karta hai, CSS design karta hai, Vite local development server aur build tool hai. Nginx optional static web server hai; first run ke liye required nahi.

## Project ko samjhein (zero se)

InfraPulse ek server monitoring application hai. Database data rakhta hai, backend data padhta/likhta hai aur frontend browser mein data dikhata hai. Agent CPU (processor ka usage), RAM (memory ka usage) aur disk (storage ka usage) bhejta hai.

```text
Agent --> FastAPI --> PostgreSQL
Browser --> React/Vite --> FastAPI --> PostgreSQL
```

| Order | Repository | Port | Kaam |
|---|---|---|---|
| 1 | infrapulse-database | 5432 | Data store |
| 2 | infrapulse-query-service | 8000 | API |
| 3 | infrapulse-query-service (agent) | No listening port | Metrics send |
| 4 | infrapulse-dashboard | 5173 | Browser UI |

**Important:** Ye guide Ubuntu 24.04 / Ubuntu WSL ke Bash terminal ko main environment maanti hai. Windows native instructions bhi niche hain. WSL use kar rahe hain to database, Python aur Node sab WSL ke andar install karein; Windows aur WSL ke commands mix na karein. Internet initial software installation ke liye chahiye. `localhost` ka matlab apna computer hai. Port ek service ka numbered connection point hai. Command blocks mein sirf commands copy karein, output ya prompt nahi. Ek command successful hone ke baad agli command chalayein.

### Folder setup

Teeno ZIP files ek hi `InfraPulse` folder mein extract karein. Ubuntu/WSL mein is guide ka assumed path `~/InfraPulse` hai. `~` aapka home folder hai. Agar ZIP Downloads mein hain, unhe file manager se home ke InfraPulse folder mein extract kar sakte hain. WSL mein `explorer.exe .` se current Linux folder Windows Explorer mein khulta hai.

```bash
mkdir -p ~/InfraPulse
cd ~/InfraPulse
pwd
ls -a
```

`mkdir -p` folder banata hai (already ho to error nahi), `cd` folder badalta hai, `pwd` current path aur `ls -a` hidden files samet contents dikhata hai. Extract ke baad structure aisa ho:

```text
InfraPulse/
  infrapulse-database/
  infrapulse-query-service/
  infrapulse-dashboard/
```

Windows native mein `C:\Users\YOUR_NAME\InfraPulse` ke badle PowerShell mein `$HOME\InfraPulse` use karein. ZIP ko Extract All se isi folder mein extract karein. Double nested folders na banayein.

## 1. Pehle do repositories running hain ya nahi?

Browser mein http://localhost:8000/health/ready kholein. Expected `{"status":"ready"}`. http://localhost:8000/api/v1/servers par JSON array aur demo servers dikhne chahiye. Agar nahi, database aur backend README follow karein. Agent terminal par HTTP 201 logs check karein. Frontend database se directly connect nahi karta.

## 2. Node.js install karein (Terminal 4)

Node.js 22 LTS is guide ka recommended version hai. Ubuntu/WSL ke liye official https://nodejs.org/en/download page par Linux ke Node 22 installation instructions follow karein (Node 22 select karein). Windows native par wahi page se Node 22 Windows installer download/run karein aur naya PowerShell open karein. npm Node ke saath aata hai. Verify:

```bash
node --version
npm --version
```

Expected Node version `v22.x.x` aur npm ka version number. Agar command not found ho to installation/PATH check karein. Ubuntu distro ka purana Node version use na karein.

## 3. Dashboard folder mein jaayein aur packages install karein

```bash
cd ~/InfraPulse/infrapulse-dashboard
ls -a
npm install
```

Windows PowerShell mein `cd "$HOME\InfraPulse\infrapulse-dashboard"` aur `Get-ChildItem -Force` use karein; npm command same hai. PowerShell script policy npm.ps1 block kare to `npm.cmd install` aur aage `npm.cmd run dev` / `npm.cmd run build` use karein. `package.json` dependencies aur scripts ka list hai; `npm install` dependencies download karke node_modules folder aur package-lock.json banata hai. Internet chahiye. `node_modules` GitHub par upload mat karein. Lockfile ko successful install ke baad commit kar sakte hain. Audit warning aaye to review karein; blindly `npm audit fix --force` na chalayein.

## 4. Frontend start karein

```bash
npm run dev
```

Ye package.json ka dev script chalata hai. Expected Vite output mein `Local: http://127.0.0.1:5173/` ya similar localhost URL. Browser mein http://localhost:5173 open karein. Port busy ho to Vite jo actual URL print kare use open karein. Terminal running rakhein. Agar aap VS Code use kar rahe hain to Terminal > New Terminal se separate terminal open kar sakte hain.

### Ab kitne terminals chal rahe hain?

| Terminal | Process | Band karna? |
|---|---|---|
| 1 | PostgreSQL service setup | SQL shell exit kar sakte hain; service running rahe |
| 2 | Uvicorn API | Nahi |
| 3 | Demo ya real agent | Nahi |
| 4 | Vite dashboard | Nahi |

## 5. Dashboard mein kya dekhna hai?

- API connected: backend se data mil raha hai.
- Total servers: database inventory count. Fresh demo mein 3; manually test kiye hon to extra servers honge.
- Online: latest sample recent hai aur usage threshold se kam hai.
- Warning: recent sample mein koi resource 85% ya zyada hai (default).
- Offline: sample missing ya 120 seconds se purani hai.
- Average CPU: reporting servers ka mean CPU; offline exclude hote hain.
- Resource utilization: server dropdown choose karein, 1h/6h/24h/7 days choose karein. Latest 2,000 points tak display hote hain.
- Server inventory: hostname/region search karein; hostname click karne par us server ka graph aayega.
- Resource alerts: Include resolved checkbox se recovered alerts dekhein.
- Refresh / Pause polling: manually refresh ya automatic 10-second refresh pause/resume karein.

Demo-db-01 disk 91% hai, isliye warning expected hai. Demo agent stop karke 120 seconds se zyada wait karne par demo servers offline ho sakte hain; agent restart se latest data aayega. Actual values synthetic demo ke hisaab se change hongi.

## 6. Data kaise travel karta hai?

`src/api.ts` relative URL `/api/v1/servers` fetch karta hai. `vite.config.ts` `/api` requests ko `http://localhost:8000` par forward karta hai (reverse proxy). FastAPI PostgreSQL se data leta hai aur JSON return karta hai. React state update karke UI render karta hai. Browser ko database password nahi diya jata. Isi proxy ki wajah se local development mein CORS setup ki zaroorat nahi hai.

## 7. Har file ka kaam

| File | Meaning |
|---|---|
| src/App.tsx | UI, cards, graph, server table, alerts aur polling |
| src/api.ts | TypeScript data types aur API fetch function |
| src/main.tsx | React app ko HTML root mein mount karta hai |
| src/style.css | Colors, spacing aur responsive layout |
| index.html | Browser page entry point |
| package.json | npm dependencies aur scripts |
| tsconfig.json | TypeScript compiler settings |
| vite.config.ts | Development server API proxy |
| nginx.conf | Optional web server config |
| .gitignore, LICENSE, README.md | Git exclusions, license, guide |

## 8. Production build (optional)

Naye terminal mein dashboard folder se:

```bash
npm run build
ls dist
```

Build script pehle `tsc --noEmit` se TypeScript check karta hai, phir `vite build` optimized static files banata hai. Expected `dist/index.html` aur `dist/assets/` folder. Windows mein `Get-ChildItem dist` use karein. Build output khud API server nahi hai. `npm run preview` ko full backend integration ka substitute na samjhein; production serving ke liye proxy configuration chahiye.

### Optional Nginx (Ubuntu/WSL only)

Local practice ke liye Vite enough hai. Nginx try karna ho to backend port 8000 par running rakhein, build ke baad:

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

`mkdir` web root, `cp` built files/config copy, `ln -s` config enable karta hai (already exists ho to existing link verify karein). `nginx -t` syntax check karta hai; successful hone par hi reload karein. Browser http://localhost:8080 open karein. Included config `/api/` ko 127.0.0.1:8000 par proxy karta hai. Sample config all interfaces par listen karti hai; strictly local lab ke liye copied config mein `listen 8080;` ko `listen 127.0.0.1:8080;` karein before enabling. Public internet par expose na karein; API read endpoints authenticated nahi hain. Nginx port 80 default site se clash ho to service logs review karein, unrelated config delete na karein.

## 9. Common errors

| Error | Solution |
|---|---|
| npm not found | Node installation aur PATH check |
| package.json not found | Correct dashboard root mein cd |
| API unavailable / 503 | Backend health URL aur DB service check |
| ECONNREFUSED | API 8000 running check; Vite proxy config check |
| Blank screen | Browser console F12 aur Vite terminal errors dekhein |
| No servers | Demo agent start / database seed verify |
| Port in use | Vite printed URL open karein; backend port 8000 unchanged rakhein |
| npm network error | Internet, proxy ya registry access check; install retry |

## 10. Daily start aur stop (installation repeat nahi karni)

Ubuntu/WSL mein computer restart ke baad:

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

Windows native: PostgreSQL Services app mein running check; backend aur agent commands ke liye respective README ka PowerShell path/executable use karein. Browser http://localhost:5173 open karein. Database creation, seed, pip install, npm install roz nahi karne hain. Stop karna ho to Vite, agent, API terminals mein Ctrl+C (isi order mein); optional local PostgreSQL service stop `sudo service postgresql stop` tabhi karein jab doosri application use nahi kar rahi. Data database mein persistent rahega. Nginx use kiya ho to optional `sudo service nginx stop`.

## 11. Final acceptance checklist

- [ ] Database mein 3 tables aur demo rows verified.
- [ ] API readiness ready aur Swagger accessible.
- [ ] Agent 201 samples bhej raha hai.
- [ ] Dashboard API connected aur server data show kar raha hai.
- [ ] Manual high CPU aur recovery test successful.
- [ ] Optional npm run build successful.
- [ ] Actual dashboard screenshot liya aur secrets hide karke GitHub par source push kiya.

## GitHub par upload (application chalane ke liye optional)

Ubuntu par `sudo apt install -y git` se Git install karein. Windows par https://git-scm.com/downloads se Git install karein. `git --version` se verify karein. GitHub.com par New repository banayein, is repo ke exact naam se. README/license initialize na karein. Public karne se pehle secrets check karein.

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

In commands ko **isi repository ke root folder mein** chalayein. `YOUR_USERNAME` apna GitHub username aur `REPO_NAME` is repository ka naam rakhein. `git init` local repo banata hai, `add` files stage karta hai, `status` review karata hai, `commit` snapshot banata hai, `remote` GitHub URL jodta hai, `push` upload karta hai. HTTPS authentication ke liye Git Credential Manager/browser login ya GitHub token use karein, account password nahi. `.env`, database dumps, `.venv`, `node_modules` aur `dist` upload nahi karne hain; `.gitignore` inhe exclude karta hai. `git status` mein secret dikhe to commit se pehle hata dein. Existing remote ho to `git remote -v` check karein; dobara init/push blindly na karein.

## Verification note

Commands source configuration ke against review kiye gaye hain. Live database, dependency installation aur browser end-to-end test is packaging environment mein execute nahi hua. Neeche/uper diye expected results acceptance checks hain, actual test results nahi. Local lab credentials examples hain; public access se pehle authentication, HTTPS aur secure secrets configure karein.
