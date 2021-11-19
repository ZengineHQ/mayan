#!/bin/sh

docker run --rm -it -v $(pwd):/plugin -v ~/.ssh:"/root/.ssh" mayan "$@"
