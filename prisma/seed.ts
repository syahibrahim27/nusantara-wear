import "dotenv/config"
import { hash } from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "../src/generated/prisma/client"
import { categories, collections, journalPosts, products, reviews, tags } from "./seed-data"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error("DATABASE_URL wajib diisi sebelum menjalankan seed.")
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

/** Stok deterministik supaya demo selalu punya variant penuh, menipis, dan habis. */
const stockFor = (productIndex: number, variantIndex: number) => {
  const pattern = [12, 8, 3, 0, 18, 5, 2, 9, 14, 1, 7, 21]
  return pattern[(productIndex * 3 + variantIndex) % pattern.length]
}

const galleryFor = (image: string, index: number) => [
  image,
  "/images/sculpture-tenun.png",
  "/images/campaign-akar.png",
  `/images/products/${String(((index + 3) % 8) + 1).padStart(2, "0")}.jpg`,
]

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@nusantarawear.test" },
    update: { passwordHash: await hash("Admin123!", 12), role: "ADMIN" },
    create: { name: "Admin Nusantara", email: "admin@nusantarawear.test", passwordHash: await hash("Admin123!", 12), role: "ADMIN" },
  })

  const staff = await prisma.user.upsert({
    where: { email: "staff@nusantarawear.test" },
    update: { passwordHash: await hash("Staff123!", 12), role: "STAFF" },
    create: { name: "Rani Operasional", email: "staff@nusantarawear.test", passwordHash: await hash("Staff123!", 12), role: "STAFF" },
  })

  const customer = await prisma.user.upsert({
    where: { email: "demo@nusantarawear.test" },
    update: { passwordHash: await hash("Demo123!", 12) },
    create: {
      name: "Ayu Demo",
      email: "demo@nusantarawear.test",
      passwordHash: await hash("Demo123!", 12),
      role: "CUSTOMER",
      addresses: {
        create: {
          label: "Rumah",
          recipientName: "Ayu Demo",
          phone: "081234567890",
          line1: "Jl. Melati No. 17",
          district: "Kebayoran Baru",
          city: "Jakarta Selatan",
          province: "DKI Jakarta",
          postalCode: "12160",
          isDefault: true,
        },
      },
    },
  })

  const secondCustomer = await prisma.user.upsert({
    where: { email: "bimo@nusantarawear.test" },
    update: {},
    create: { name: "Bimo Prasetya", email: "bimo@nusantarawear.test", passwordHash: await hash("Demo123!", 12), role: "CUSTOMER" },
  })

  const categoryRows = await Promise.all(
    categories.map((category, index) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, description: category.description, image: category.image, sortOrder: index },
        create: { ...category, sortOrder: index },
      }),
    ),
  )
  const categoryBySlug = new Map(categoryRows.map((row) => [row.slug, row]))

  const collectionRows = await Promise.all(
    collections.map((collection) =>
      prisma.collection.upsert({ where: { slug: collection.slug }, update: collection, create: collection }),
    ),
  )
  const collectionBySlug = new Map(collectionRows.map((row) => [row.slug, row]))

  const tagRows = await Promise.all(tags.map((tag) => prisma.productTag.upsert({ where: { slug: tag.slug }, update: {}, create: tag })))
  const tagBySlug = new Map(tagRows.map((row) => [row.slug, row]))

  const productRows = []
  for (const [index, product] of products.entries()) {
    const category = categoryBySlug.get(product.category)!
    const collection = collectionBySlug.get(product.collection)!

    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        details: { material: product.material, modelSizing: product.modelSizing },
        careInstructions: product.care,
        categoryId: category.id,
        basePrice: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        status: "ACTIVE",
        publishedAt: daysAgo(index * 3 + 2),
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        details: { material: product.material, modelSizing: product.modelSizing },
        careInstructions: product.care,
        status: "ACTIVE",
        categoryId: category.id,
        basePrice: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        seoTitle: `${product.name} — Nusantara Wear`,
        seoDescription: product.description.slice(0, 155),
        publishedAt: daysAgo(index * 3 + 2),
        images: {
          create: galleryFor(product.image, index).map((url, position) => ({
            url,
            alt: `${product.name}, tampilan ${position + 1}`,
            width: 1000,
            height: 1333,
            position,
          })),
        },
        collections: { create: { collectionId: collection.id, position: index } },
        tags: { create: product.tags.map((slug) => ({ tagId: tagBySlug.get(slug)!.id })) },
      },
    })

    let variantIndex = 0
    for (const [colorName, colorHex] of product.colors) {
      for (const size of product.sizes) {
        const sku = `NW-${String(index + 1).padStart(3, "0")}-${colorName.slice(0, 2).toUpperCase()}-${size.replace(/\s/g, "").toUpperCase()}`
        const variant = await prisma.productVariant.upsert({
          where: { productId_colorName_size: { productId: created.id, colorName, size } },
          update: { isActive: true },
          create: { productId: created.id, sku, colorName, colorHex, size, weightGrams: 320 + index * 15, isActive: true },
        })
        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          update: {},
          create: { variantId: variant.id, onHand: stockFor(index, variantIndex), reorderPoint: 3 },
        })
        variantIndex += 1
      }
    }

    productRows.push(created)
  }

  await prisma.promotion.upsert({
    where: { code: "PERTAMA10" },
    update: {},
    create: {
      code: "PERTAMA10",
      name: "Sepuluh persen untuk pembelian pertama",
      type: "PERCENTAGE",
      value: 10,
      minimumSubtotal: 300_000,
      maxDiscount: 150_000,
      usageLimit: 1000,
      perCustomerLimit: 1,
      startsAt: new Date("2026-01-01"),
      endsAt: new Date("2027-01-01"),
    },
  })
  await prisma.promotion.upsert({
    where: { code: "BEBASONGKIR" },
    update: {},
    create: {
      code: "BEBASONGKIR",
      name: "Bebas ongkir untuk belanja di atas Rp300.000",
      type: "FREE_SHIPPING",
      value: 0,
      minimumSubtotal: 300_000,
      usageLimit: 500,
      perCustomerLimit: 2,
      startsAt: new Date("2026-01-01"),
      endsAt: new Date("2027-01-01"),
    },
  })

  for (const [index, post] of journalPosts.entries()) {
    await prisma.journalPost.upsert({
      where: { slug: post.slug },
      update: { title: post.title, excerpt: post.excerpt, content: post.content, coverImage: post.coverImage, status: "PUBLISHED" },
      create: {
        ...post,
        status: "PUBLISHED",
        publishedAt: daysAgo(index * 14 + 3),
        authorId: admin.id,
        seoTitle: post.title,
        seoDescription: post.excerpt.slice(0, 155),
      },
    })
  }

  if ((await prisma.order.count()) === 0) {
    const statuses = [
      { status: "PENDING_PAYMENT", fulfillment: "UNFULFILLED", paid: false },
      { status: "PAID", fulfillment: "PROCESSING", paid: true },
      { status: "PROCESSING", fulfillment: "PROCESSING", paid: true },
      { status: "SHIPPED", fulfillment: "SHIPPED", paid: true },
      { status: "COMPLETED", fulfillment: "DELIVERED", paid: true },
      { status: "COMPLETED", fulfillment: "DELIVERED", paid: true },
      { status: "CANCELLED", fulfillment: "CANCELLED", paid: false },
      { status: "REFUNDED", fulfillment: "CANCELLED", paid: true },
    ] as const

    for (const [index, plan] of statuses.entries()) {
      const product = productRows[index]
      const variant = await prisma.productVariant.findFirstOrThrow({ where: { productId: product.id }, include: { product: { include: { images: true } } } })
      const quantity = (index % 2) + 1
      const subtotal = product.basePrice * quantity
      const shippingTotal = index % 3 === 0 ? 0 : 24_000
      const buyer = index % 3 === 2 ? secondCustomer : customer

      const order = await prisma.order.create({
        data: {
          orderNumber: `NW-2026-${String(index + 1).padStart(5, "0")}`,
          userId: buyer.id,
          email: buyer.email,
          phone: "081234567890",
          status: plan.status,
          fulfillmentStatus: plan.fulfillment,
          subtotal,
          discountTotal: 0,
          shippingTotal,
          grandTotal: subtotal + shippingTotal,
          shippingAddress: {
            recipientName: buyer.name,
            phone: "081234567890",
            line1: "Jl. Melati No. 17",
            district: "Kebayoran Baru",
            city: "Jakarta Selatan",
            province: "DKI Jakarta",
            postalCode: "12160",
            country: "ID",
          },
          shippingMethod: shippingTotal === 0 ? "STUDIO" : "REGULER",
          idempotencyKey: `seed-order-${index + 1}`,
          createdAt: daysAgo(30 - index * 3),
          items: {
            create: {
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              sku: variant.sku,
              variantLabel: `${variant.colorName} / ${variant.size}`,
              imageUrl: variant.product.images[0]?.url ?? "/images/products/01.jpg",
              unitPrice: product.basePrice,
              quantity,
              lineTotal: subtotal,
            },
          },
          payments: {
            create: {
              provider: "mock",
              providerReference: `MOCK-SEED-${index + 1}`,
              method: index % 2 ? "QRIS" : "VA",
              status: plan.paid ? (plan.status === "REFUNDED" ? "REFUNDED" : "PAID") : plan.status === "CANCELLED" ? "EXPIRED" : "PENDING",
              amount: subtotal + shippingTotal,
              idempotencyKey: `seed-payment-${index + 1}`,
              paidAt: plan.paid ? daysAgo(30 - index * 3) : null,
            },
          },
        },
      })

      if (plan.paid) {
        await prisma.inventoryMovement.create({
          data: { variantId: variant.id, orderId: order.id, type: "SALE", quantity: -quantity, reason: `Penjualan ${order.orderNumber}` },
        })
        await prisma.inventory.updateMany({
          where: { variantId: variant.id, onHand: { gte: quantity } },
          data: { onHand: { decrement: quantity }, version: { increment: 1 } },
        })
      }

      if (plan.fulfillment === "SHIPPED" || plan.fulfillment === "DELIVERED") {
        await prisma.shipment.create({
          data: {
            orderId: order.id,
            carrier: "Nusantara Kirim",
            service: "Reguler",
            trackingNumber: `NWX${String(700_000_000 + index)}`,
            status: plan.fulfillment,
            shippedAt: daysAgo(28 - index * 3),
            deliveredAt: plan.fulfillment === "DELIVERED" ? daysAgo(25 - index * 3) : null,
          },
        })
      }
    }
  }

  if ((await prisma.review.count()) < reviews.length) {
    await prisma.review.deleteMany({})
    for (const [index, review] of reviews.entries()) {
      await prisma.review.create({
        data: {
          productId: productRows[index % productRows.length].id,
          userId: index % 3 === 0 ? secondCustomer.id : customer.id,
          rating: review.rating,
          title: review.title,
          body: review.body,
          status: "PUBLISHED",
          createdAt: daysAgo(index * 2 + 1),
        },
      })
    }
  }

  await prisma.wishlistItem.createMany({
    data: productRows.slice(0, 3).map((product) => ({ userId: customer.id, productId: product.id })),
    skipDuplicates: true,
  })

  const variantCount = await prisma.productVariant.count()
  console.info(
    `Seed selesai: ${productRows.length} produk, ${variantCount} variant, ${journalPosts.length} artikel, ${reviews.length} review, 2 promo, 8 order.`,
  )
  console.info(`Akun: ${admin.email} / Admin123! · ${staff.email} / Staff123! · ${customer.email} / Demo123!`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
