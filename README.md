## Usage

### Execute Command
```
curl -v -F host=10.10.50.18 -F port=22 -F user=root -F command="docker ps -a" http://localhost:22222/command
```
### Copy file
```
curl -v -F host=10.10.50.18 -F port=22 -F user=root -F remotePath=/var/www -F file=@"/Users/harrison.nguyen/Downloads/haproxy.cfg" http://localhost:22222/scp
```

## Deployment
```
docker stack deploy --compose-file=docker-compose.yml --with-registry-auth nexops
```