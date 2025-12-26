#!/bin/bash
#
# Manual Release Script for Linear Calendar 2
#
# Usage:
#   ./scripts/release.sh 1.0.0        # Creates v1.0.0 release
#   ./scripts/release.sh 1.1.0        # Creates v1.1.0 release
#
# Semantic Versioning:
#   MAJOR.MINOR.PATCH
#   - PATCH: Bug fixes (1.0.0 -> 1.0.1)
#   - MINOR: New features, backwards compatible (1.0.0 -> 1.1.0)
#   - MAJOR: Breaking changes (1.0.0 -> 2.0.0)

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version number required${NC}"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.0"
    exit 1
fi

VERSION=$1
TAG="v${VERSION}"

echo -e "${YELLOW}=== Linear Calendar 2 Release Script ===${NC}"
echo -e "Version: ${GREEN}${VERSION}${NC}"
echo ""

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}Error: Invalid version format. Use MAJOR.MINOR.PATCH (e.g., 1.0.0)${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo -e "${RED}Error: Tag ${TAG} already exists.${NC}"
    exit 1
fi

echo "Step 1/6: Running tests..."
npm test

echo "Step 2/6: Running type check..."
npm run typecheck

echo "Step 3/6: Building..."
npm run build

echo "Step 4/6: Updating manifest.json version..."
# Use jq if available, otherwise use sed
if command -v jq &> /dev/null; then
    jq --arg v "$VERSION" '.version = $v' manifest.json > manifest.tmp && mv manifest.tmp manifest.json
else
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" manifest.json
    rm -f manifest.json.bak
fi

echo "Step 5/6: Updating package.json version..."
npm version $VERSION --no-git-tag-version

echo "Step 6/6: Creating git tag and committing..."
git add manifest.json package.json package-lock.json
git commit -m "chore: release v${VERSION}"
git tag -a "$TAG" -m "Release ${TAG}"

echo ""
echo -e "${GREEN}=== Release ${TAG} created locally ===${NC}"
echo ""
echo "To publish the release:"
echo "  git push origin main"
echo "  git push origin ${TAG}"
echo ""
echo "This will trigger the GitHub Actions workflow to create the release."
echo ""
echo "Or create a manual release at:"
echo "  https://github.com/pyjoku/linear-calendar-2/releases/new"
