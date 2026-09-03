import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TITLES = [
  "Kepala Mekanik",
  "Mekanik Senior",
  "Mekanik Junior",
  "Teknisi Senior",
  "Teknisi Junior",
  "Spesialis Engine Diesel",
  "Spesialis Engine Bensin",
  "Teknisi Suspensi",
  "Spesialis Alignment",
  "Spesialis Mesin & Transmisi",
  "Spesialis Kelistrikan",
  "SPI / Kotak dan Instalasi",
  "AC Mobil",
  "Diagnostik OBD",
  "Body Repair & Cat",
];

async function seedTitles() {
  for (const name of DEFAULT_TITLES) {
    await prisma.title.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

async function main() {
  await seedTitles();

  const user = await prisma.user.upsert({
    where: { email: "admin@ruangmekanik.com" },
    update: {
      username: "chiefmechanic",
      name: "Chief Mechanic",
      titles: ["Kepala Mekanik", "Spesialis Engine Diesel"],
      score: 120,
    },
    create: {
      name: "Chief Mechanic",
      username: "chiefmechanic",
      email: "admin@ruangmekanik.com",
      role: "admin",
      titles: ["Kepala Mekanik", "Spesialis Engine Diesel"],
      score: 120,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: "teknisi2@ruangmekanik.com" },
    update: { username: "teknisi-suspen", titles: ["Teknisi Suspensi", "Spesialis Alignment"], score: 45 },
    create: {
      name: "Rudi Pratama",
      username: "teknisi-suspen",
      email: "teknisi2@ruangmekanik.com",
      role: "user",
      titles: ["Teknisi Suspensi", "Spesialis Alignment"],
      score: 45,
      bio: "Fokus pada sistem suspensi, steering, dan alignment roda.",
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: "dhannid001@gmail.com" },
    update: { username: "dhnnz" },
    create: {
      name: "Dhan",
      username: "dhnnz",
      email: "dhannid001@gmail.com",
      role: "user",
      titles: ["Kotak dan Instalasi", "AC Mobil"],
    },
  });

  await prisma.guide.upsert({
    where: { slug: "prosedur-overhaul-mesin-diesel-4-silinder" },
    update: {},
    create: {
      title: "Prosedur Overhaul Mesin Diesel 4 Silinder",
      slug: "prosedur-overhaul-mesin-diesel-4-silinder",
      category: "Mesin",
      content:
        "<h3>1. Pembongkaran Blok Mesin</h3><p>Pastikan oli mesin dan cairan pendingin telah dikuras sepenuhnya sebelum melepas kepala silinder. Gunakan kunci momen untuk mengendurkan baut kepala silinder dengan urutan menyilang.</p><h3>2. Pemeriksaan Toleransi Celah Piston</h3><p>Ukur diameter dalam silinder menggunakan <em>cylinder bore gauge</em> pada tiga posisi ketinggian yang berbeda untuk memeriksa keausan konis dan ovalitas.</p>",
      authorId: user.id,
      viewsCount: 142,
    },
  });

  await prisma.guide.upsert({
    where: { slug: "kalibrasi-sistem-injeksi-common-rail" },
    update: {},
    create: {
      title: "Kalibrasi dan Diagnosa Sistem Injeksi Common Rail",
      slug: "kalibrasi-sistem-injeksi-common-rail",
      category: "Elektrikal & Injeksi",
      content:
        "<p>Pemeriksaan tekanan <em>rail pressure sensor</em> wajib dilakukan menggunakan alat pemindai diagnostik berstandar manufaktur. Pastikan tekanan suplai pompa sirkulasi awal berada di kisaran 3.5 hingga 5 bar sebelum uji beban injektor.</p>",
      authorId: user.id,
      viewsCount: 98,
    },
  });

  const diagnostic = await prisma.diagnostic.upsert({
    where: { slug: "gejala-knocking-pada-putaran-menengah-mesin-bensin" },
    update: {},
    create: {
      title: "Gejala Knocking pada Putaran Menengah Mesin Bensin",
      slug: "gejala-knocking-pada-putaran-menengah-mesin-bensin",
      content:
        "Terdeteksi getaran dan suara gemeretak halus saat akselerasi di 2500 RPM. Nilai timing advance pada scanner menunjukkan angka 28 derajat. Apakah potensi penumpukan kerak karbon di ruang bakar atau masalah sensor detokasi (knock sensor)?",
      authorId: user.id,
    },
  });

  const existingComments = await prisma.diagnosticComment.count({ where: { diagnosticId: diagnostic.id } });
  if (existingComments === 0) {
    const c1 = await prisma.diagnosticComment.create({
      data: {
        content: "Coba periksa tegangan output knock sensor dengan osiloskop saat mesin diberi beban dinamis.",
        diagnosticId: diagnostic.id,
        authorId: user.id,
      },
    });
    await prisma.diagnosticComment.create({
      data: {
        parentId: c1.id,
        content: "Setuju, sebelumnya kasus serupa sembuh setelah mengganti sensor dan membersihkan konektor.",
        diagnosticId: diagnostic.id,
        authorId: tech2.id,
      },
    });
    await prisma.diagnosticComment.create({
      data: {
        content: "Lakukan kuras ruang bakar (carbon clean) dan cek ulang angka trim bahan bakar jangka panjang (LTFT).",
        diagnosticId: diagnostic.id,
        authorId: user.id,
      },
    });
  } else {
    const replyCount = await prisma.diagnosticComment.count({
      where: { diagnosticId: diagnostic.id, parentId: { not: null } },
    });
    if (replyCount === 0) {
      const topComment = await prisma.diagnosticComment.findFirst({
        where: { diagnosticId: diagnostic.id },
        orderBy: { createdAt: "asc" },
      });
      if (topComment) {
        await prisma.diagnosticComment.create({
          data: {
            parentId: topComment.id,
            content: "Setuju, sebelumnya kasus serupa sembuh setelah mengganti sensor dan membersihkan konektor.",
            diagnosticId: diagnostic.id,
            authorId: tech2.id,
          },
        });
      }
    }
  }

  const existingTools = await prisma.tool.count();
  if (existingTools === 0) {
    await prisma.tool.createMany({
      data: [
        { name: "Kunci Momen Digital 1/2 Inch (10-200 Nm)", condition: "Baik / Terkalibrasi", ownerId: user.id, isAvailable: true },
        { name: "Scanner Diagnostik OBD2 Enterprise Multi-Brand", condition: "Baik", ownerId: user.id, isAvailable: true },
        { name: "Cylinder Bore Gauge Set (50-160mm)", condition: "Baik / Presisi High", ownerId: user.id, isAvailable: false },
        { name: "Kompresi Tester Mesin Diesel Heavy Duty", condition: "Baik", ownerId: user.id, isAvailable: true },
      ],
    });
  }

  const existingConversations = await prisma.conversation.count();
  if (existingConversations === 0) {
    const mechId = user.id;
    const techId = tech2.id;
    const pair = mechId < techId ? [mechId, techId] : [techId, mechId];

    const conversation = await prisma.conversation.create({
      data: {
        user1Id: pair[0],
        user2Id: pair[1],
      },
    });

    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          senderId: mechId,
          content: "Rudi, setelah overhaul kemarin, bagaimana hasil uji kompresi mesin diesel itu?",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        },
        {
          conversationId: conversation.id,
          senderId: techId,
          content: "Sudah presisi chief, ketiga silinder warnanya konsisten. Tinggal saya tandai alat di inventaris kembali tersedia.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        },
        {
          conversationId: conversation.id,
          senderId: mechId,
          content: "Bagus. Nanti kita kalibrasi bike pump-nya bareng jam istirahat, ada item baru masuk dari supplier.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        },
        {
          conversationId: conversation.id,
          senderId: techId,
          content: "Siap, saya siapkan tool set alignment dulu. Terima kasih chief.",
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
          readAt: null,
        },
      ],
    });
  }

  const dhnnzPair = [user.id, admin2.id].sort();
  const dhnnzConv = await prisma.conversation.upsert({
    where: { user1Id_user2Id: { user1Id: dhnnzPair[0], user2Id: dhnnzPair[1] } },
    update: {},
    create: { user1Id: dhnnzPair[0], user2Id: dhnnzPair[1] },
  });
  const dhnnzMsgs = await prisma.message.count({ where: { conversationId: dhnnzConv.id } });
  if (dhnnzMsgs === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: dhnnzConv.id,
          senderId: user.id,
          content: "Dhan, entri valance bumper di job AC semalam sudah selesai saya tanda tangani? butuh untuk laporan pricelist.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
          readAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
        },
        {
          conversationId: dhnnzConv.id,
          senderId: admin2.id,
          content: "Sudah chief, sekalian voucher fotonya saya taruh di shared folder inventaris.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
          readAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
        {
          conversationId: dhnnzConv.id,
          senderId: user.id,
          content: "Oke. Besok pagi ada unit fortuner masuk untuk instalasi lampu + alarm, kamu pegang.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          readAt: null,
        },
      ],
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });