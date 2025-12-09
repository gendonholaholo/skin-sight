# Use Node.js LTS (Long Term Support) version on Alpine Linux for a small footprint
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
# This ensures that 'npm install' is only re-run when dependencies change
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the default Vite port
EXPOSE 5173

# Start the development server
# We use 'npm run dev' which typically runs 'vite'
CMD ["npm", "run", "dev"]
