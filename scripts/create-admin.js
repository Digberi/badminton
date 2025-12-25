#!/usr/bin/env node

/**
 * Script to create an admin user
 * Usage: node scripts/create-admin.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve)
  })
}

async function main() {
  console.log('\n=== Create Admin User ===\n')

  const name = await question('Name: ')
  const email = await question('Email: ')
  const password = await question('Password: ')

  if (!email || !password) {
    console.error('Email and password are required')
    process.exit(1)
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    console.error(`User with email ${email} already exists`)
    process.exit(1)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user
  const user = await prisma.user.create({
    data: {
      name: name || null,
      email,
      password: hashedPassword,
      role: 'ADMIN',
    }
  })

  console.log('\n✅ Admin user created successfully!')
  console.log(`ID: ${user.id}`)
  console.log(`Email: ${user.email}`)
  console.log(`Role: ${user.role}\n`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    rl.close()
    process.exit(0)
  })
