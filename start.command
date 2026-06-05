#!/bin/bash
# Earthy Stays — local preview launcher.
# Double-click this file in Finder to start the dev server.
cd "$(dirname "$0")"
source "$HOME/.nvm/nvm.sh"
nvm use 20
echo ""
echo "🏡  Earthy Stays — preview at http://localhost:3000"
echo "    Close this window or press Ctrl-C to stop."
echo ""
npm run dev
