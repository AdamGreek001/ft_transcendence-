#!/bin/sh

echo "Waiting for Elasticsearch to be ready..."
until curl -s http://elasticsearch:9200/_cluster/health | grep -E '"status":"(green|yellow)"' > /dev/null; do
  echo "Still waiting for Elasticsearch..."
  sleep 5
done

echo "Elasticsearch is up! Creating ILM (Index Lifecycle Management) retention policy..."

# Create a policy that automatically deletes indices after 15 days
curl -s -X PUT "http://elasticsearch:9200/_ilm/policy/log-retention-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "set_priority": {
            "priority": 100
          }
        }
      },
      "delete": {
        "min_age": "15d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}'

echo ""
echo "Creating index template to apply retention policy automatically..."

# Apply this policy to all indices matching "docker-logs-*"
curl -s -X PUT "http://elasticsearch:9200/_index_template/log-retention-template" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["docker-logs-*"],
  "priority": 100,
  "template": {
    "settings": {
      "index.lifecycle.name": "log-retention-policy"
    }
  }
}'

echo ""
echo "ILM retention policy setup successfully completed!"
