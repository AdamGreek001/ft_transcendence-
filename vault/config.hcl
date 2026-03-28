# ─── HashiCorp Vault Configuration ─────────────────────────────

ui = true
disable_mlock = true

storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # TLS handled by WAF/nginx
}

api_addr = "http://0.0.0.0:8200"
