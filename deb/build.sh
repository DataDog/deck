#!/bin/bash
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
IFS=$'\n\t'
set -euxo pipefail

install -v -d /buildroot/opt/deck/html
rsync -az build/webpack/ /buildroot/opt/deck/html/
