echo "Waiting for MySQL..."

echo "Waiting for database root user to be created"
npm run create-root

echo "Starting backend..."
npm start