#!/bin/bash
set -e

IMAGE_NAME="cmp-crm"
SERVER="tic@192.168.100.106 -p 2222"
DEPLOY_PATH="/opt/crm"

echo "==> Building Docker image..."
docker build -t $IMAGE_NAME:latest .

echo "==> Saving image..."
docker save $IMAGE_NAME:latest | gzip > $IMAGE_NAME.tar.gz

echo "==> Uploading source..."
scp -P 2222 -r ./* tic@192.168.100.106:$DEPLOY_PATH/

echo "==> Uploading image..."
scp -P 2022 $IMAGE_NAME.tar.gz tic@192.168.100.106:$DEPLOY_PATH/

echo "==> Deploying on server..."
ssh -p 2222 tic@192.168.100.106 << 'EOF'
  set -e
  cd /opt/crm

  echo "Loading image..."
  docker load < cmp-crm.tar.gz

  echo "Restarting..."
  sudo docker compose -f docker-compose.prod.yml up -d --force-recreate app

  echo "Waiting..."
  sleep 5

  if curl -sf http://localhost:4000 > /dev/null; then
    echo "OK - deployed!"
  else
    echo "FAILED"
    sudo docker compose -f docker-compose.prod.yml logs --tail=20 app
    exit 1
  fi

  rm -f cmp-crm.tar.gz
EOF

rm -f $IMAGE_NAME.tar.gz
echo "==> Done!"
