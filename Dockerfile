FROM public.ecr.aws/lambda/nodejs:20

# Install dependencies for canvas and Japanese fonts
RUN microdnf install -y \
    cairo-devel \
    pango-devel \
    libjpeg-turbo-devel \
    giflib-devel \
    librsvg2-devel \
    google-noto-sans-cjk-fonts \
    google-noto-color-emoji-fonts \
    && microdnf clean all

# Copy package files
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install Node.js dependencies
RUN npm ci --production

# Copy source code
COPY dist/ ${LAMBDA_TASK_ROOT}/dist/

# Set the CMD to your handler
CMD [ "dist/index.handler" ]
