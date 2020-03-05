#!/usr/bin/bash

docker run --rm --name nginx -p 8000:80 -v `pwd`/nginx.conf:/etc/nginx/nginx.conf:ro -v `pwd`/serve:/usr/share/nginx/html:ro nginx