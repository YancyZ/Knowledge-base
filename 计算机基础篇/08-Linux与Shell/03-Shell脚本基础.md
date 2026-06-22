# Shell 脚本基础

重复三遍的部署步骤应写成**可版本管理的脚本** — Bash/sh 在 CI、cron、开机自启里无处不在。变量、条件、循环与**严格模式**足够覆盖多数全栈自动化，复杂逻辑仍应用 Node/Python。

---

## Shebang 与执行

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Hello, ${USER:-guest}"
```

| 行 | 含义 |
|----|------|
| `#!/usr/bin/env bash` | 用 PATH 里 bash |
| `set -e` | 任一命令失败则退出 |
| `set -u` | 未定义变量报错 |
| `set -o pipefail` | 管道中任一失败则整体失败 |

```bash
chmod +x deploy.sh
./deploy.sh
# 或
bash deploy.sh
```

---

## 变量与引号

| 形式 | 行为 |
|------|------|
| `$VAR` | 展开 |
| `"$VAR"` | 双引号内展开，保空格 |
| `'$VAR'` | 单引号不展开 |
| `$(cmd)` | 命令替换 |
| `${VAR:-default}` | 默认值 |

```bash
APP_ENV="${1:-production}"
VERSION=$(git rev-parse --short HEAD)
echo "Deploy $APP_ENV @ $VERSION"
```

**勿**在脚本里写密码明文 — 用环境变量或密钥管理。

---

## 条件判断

```bash
if [[ -f .env ]]; then
  source .env
elif [[ -d backups ]]; then
  echo "has backups"
else
  echo "missing" >&2
  exit 1
fi
```

| 测试 | 说明 |
|------|------|
| `[[ -f file ]]` | 是普通文件 |
| `[[ -d dir ]]` | 目录存在 |
| `[[ -z "$s" ]]` | 字符串空 |
| `[[ "$a" == "$b" ]]` | 字符串相等 |
| `(( n > 0 ))` | 算术 |

```bash
# 命令成败
if curl -sf http://localhost/health; then
  echo ok
fi
```

---

## 循环与 case

```bash
for f in config/*.yaml; do
  echo "Processing $f"
done

while read -r line; do
  echo "$line"
done < users.txt

case "$1" in
  start)   systemctl start app ;;
  stop)    systemctl stop app ;;
  restart) systemctl restart app ;;
  *)       echo "Usage: $0 {start|stop|restart}"; exit 1 ;;
esac
```

---

## 函数与返回值

```bash
log() { echo "[$(date +%H:%M:%S)] $*"; }

wait_for_port() {
  local host=$1 port=$2
  for i in {1..30}; do
    if nc -z "$host" "$port" 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}
```

函数用 `return 0/1` 或 `exit`（会退出整个脚本）。

---

## 数组与参数

```bash
args=("$@")
files=("a.js" "b.js")
echo "${files[0]}"
echo "argc=$#"
```

CI 里 `"$@"` 正确传递含空格的参数。

---

## 实用片段

```bash
# 脚本所在目录（便于相对路径）
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# 临时目录，退出清理
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
```

| 场景 | 脚本位置 |
|------|----------|
| GitHub Actions | `workflow` 的 `run:` |
| package.json | `"deploy": "bash scripts/deploy.sh"` |
| systemd | `ExecStart=/opt/app/start.sh` |

与 07-日志定时任务与运维 的 cron 衔接。

---

## 小结

Bash 脚本以 shebang + `set -euo pipefail` 打底；引号与 `$(…)` 避免 word split；条件/循环/case 覆盖部署与健康检查 — 复杂逻辑用高级语言。

**易混点**：`=` 赋值两侧无空格；`[[ ]]` 与 `[ ]` 差异；`source` 与 `.` 等价；子 shell `( )` 与当前 shell `{ }` 变量可见性不同。

核对：`set -e` 对管道中间失败是否默认生效？如何获取脚本文件自身目录？
