#!/bin/sh

docker run --rm -it -p 1234:1234 -p 3000:3000 -v $(pwd):/plugin -v ~/.ssh:"/root/.ssh" mayan "$@"
