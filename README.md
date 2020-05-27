# ProxiGen - a proxy client for host remapping powered by RedBird

### Usage
```bash
yarn global add proxigen
proxigen start
```

### Configuration
```yaml
# ~/.proxigenrc in YAML format
server:
  port: 80
mappings:
  - from: tank.giot.in
    to: http://localhost:3000
```

### SSL
1. Generate certifications with certbot and openssl
    ```bash
    # use certbot to generate pems firstly.
    # TODO: cerbot example

    # since redbird used by proxigen does not support privkey.pem directly, we need to convert it into rsa key
    openssl rsa -in privkey.pem -out privkey.rsa.pem
    ```
2. Edit `~/.proxigenrc` file
    ```yaml
    server:
      ssl:
        port: 443
    mappings:
      - from: tank.giot.in/gsen
        to: http://localhost:3000
        options:
          ssl:
            key: '/your/path/to/privkey.rsa.pem'
            cert: '/your/path/to/fullchain.pem'
    ```
