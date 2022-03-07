#!/bin/bash -e

git tag -d $@
git push --delete origin $@
