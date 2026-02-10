# Use Node.js LTS (Long Term Support) as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5001

# Command to run the application
# Using 'npm run dev' for development with nodemon (ensure nodemon is in package.json or installed)
CMD ["npm", "run", "dev"]
