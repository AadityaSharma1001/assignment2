echo "⏳ Waiting for Postgres at $DATABASE_URL..."

until npx prisma db push > /dev/null 2>&1; do
  >&2 echo "🚫 Postgres is unavailable - sleeping"
  sleep 2
done

echo "✅ Postgres is up - running migrations..."
npx prisma migrate deploy

echo "🚀 Starting backend..."
npm run start
