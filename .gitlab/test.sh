#!/bin/bash

npm test && (pkill -9 node && touch success) || (pkill node && exit 1)