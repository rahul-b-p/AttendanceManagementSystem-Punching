# Use the official Node.js 22.14.0 image as the base image
FROM node:22.14.0

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the application
RUN npm run build


# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]