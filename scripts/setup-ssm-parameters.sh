#!/bin/bash

# SSM Parameter Store setup script for Grass Canvas
# This script creates secure parameters in AWS Systems Manager Parameter Store

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
SSM_GITHUB_TOKEN_PATH="${SSM_GITHUB_TOKEN_PATH:-github-token}"
SSM_LINE_CHANNEL_ACCESS_TOKEN_PATH="${SSM_LINE_CHANNEL_ACCESS_TOKEN_PATH:-/grass-canvas/line-channel-access-token}"
SSM_LINE_USER_ID_PATH="${SSM_LINE_USER_ID_PATH:-/grass-canvas/line-user-id}"

echo -e "${GREEN}=== Grass Canvas SSM Parameter Setup ===${NC}\n"

# Function to create or update SSM parameter
create_or_update_parameter() {
    local param_name=$1
    local param_value=$2
    local param_type=${3:-SecureString}
    local description=$4

    if [ -z "$param_value" ]; then
        echo -e "${YELLOW}Skipping ${param_name} (empty value)${NC}"
        return
    fi

    echo -e "${GREEN}Setting parameter: ${param_name}${NC}"

    # Check if parameter exists
    if aws ssm get-parameter --name "$param_name" --region "$AWS_REGION" &>/dev/null; then
        echo "Parameter exists, updating..."
        aws ssm put-parameter \
            --name "$param_name" \
            --value "$param_value" \
            --type "$param_type" \
            --overwrite \
            --region "$AWS_REGION" \
            --description "$description" \
            > /dev/null
    else
        echo "Creating new parameter..."
        aws ssm put-parameter \
            --name "$param_name" \
            --value "$param_value" \
            --type "$param_type" \
            --region "$AWS_REGION" \
            --description "$description" \
            > /dev/null
    fi

    echo -e "${GREEN}✓ Successfully set ${param_name}${NC}\n"
}

# Prompt for values if not set in environment
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}GitHub Token (optional - press Enter to skip):${NC}"
    read -rs GITHUB_TOKEN
    echo
fi

if [ -z "$LINE_CHANNEL_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}LINE Channel Access Token (required):${NC}"
    read -rs LINE_CHANNEL_ACCESS_TOKEN
    echo
fi

if [ -z "$LINE_USER_ID" ]; then
    echo -e "${YELLOW}LINE User ID (required):${NC}"
    read -r LINE_USER_ID
    echo
fi

# Validate required values
if [ -z "$LINE_CHANNEL_ACCESS_TOKEN" ] || [ -z "$LINE_USER_ID" ]; then
    echo -e "${RED}Error: LINE Channel Access Token and User ID are required${NC}"
    exit 1
fi

# Create or update parameters
echo -e "${GREEN}Creating/updating SSM parameters...${NC}\n"

create_or_update_parameter \
    "$SSM_GITHUB_TOKEN_PATH" \
    "$GITHUB_TOKEN" \
    "SecureString" \
    "GitHub Personal Access Token for Grass Canvas"

create_or_update_parameter \
    "$SSM_LINE_CHANNEL_ACCESS_TOKEN_PATH" \
    "$LINE_CHANNEL_ACCESS_TOKEN" \
    "SecureString" \
    "LINE Channel Access Token for Grass Canvas"

create_or_update_parameter \
    "$SSM_LINE_USER_ID_PATH" \
    "$LINE_USER_ID" \
    "String" \
    "LINE User ID for Grass Canvas notifications"

echo -e "${GREEN}=== SSM Parameters Setup Complete ===${NC}\n"
echo -e "Parameters created in region: ${YELLOW}${AWS_REGION}${NC}"
echo -e "You can view them in the AWS Console or use:"
echo -e "  aws ssm get-parameter --name ${SSM_GITHUB_TOKEN_PATH} --with-decryption"
echo -e "  aws ssm get-parameter --name ${SSM_LINE_CHANNEL_ACCESS_TOKEN_PATH} --with-decryption"
echo -e "  aws ssm get-parameter --name ${SSM_LINE_USER_ID_PATH}"
