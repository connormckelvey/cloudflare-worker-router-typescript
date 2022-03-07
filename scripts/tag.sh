#!/bin/bash -e

git tag $@
git push origin $@
