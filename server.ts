import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index";
import { 
  users, 
  patients, 
  companions, 
  rooms, 
  beds, 
  stays, 
  services, 
  stayServices, 
  invoices, 
  auditLogs, 
  documents, 
  stayCompanions, 
  appSettings,
  inventoryItems,
  inventoryTransactions,
  assets,
  maintenanceSchedules,
  maintenanceLogs
} from "./src/db/schema";
import { eq, and, sql, desc, or, like, aliasedTable, inArray, gte, lte } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const resolvedFilename = typeof __filename !== "undefined"
  ? __filename
  : fileURLToPath(typeof import.meta !== "undefined" && import.meta.url ? import.meta.url : "file:///server.ts");
const resolvedDirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(resolvedFilename);
const JWT_SECRET = process.env.JWT_SECRET || "guest-house-secret-key-123";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Bypassing auth for now as requested
      (req as any).user = { id: 1, name: "مستخدم تجريبي", email: "guest@example.com", role: "admin" };
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        // Bypassing auth for now as requested
        (req as any).user = { id: 1, name: "مستخدم تجريبي", email: "guest@example.com", role: "admin" };
        return next();
      }
      (req as any).user = user;
      next();
    });
  };

  const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      next();
    };
  };

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [newUser] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: role || "data_entry",
      }).returning();
      res.json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "8h" });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json((req as any).user);
  });

  app.patch("/api/auth/change-password", authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
      res.json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- User Management (Admin Only) ---
  app.get("/api/users", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      }).from(users);
      res.json(allUsers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/users/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
    const { name, role, email } = req.body;
    try {
      const [updatedUser] = await db.update(users)
        .set({ name, role, email })
        .where(eq(users.id, parseInt(req.params.id)))
        .returning();
      res.json(updatedUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/users/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
    try {
      await db.delete(users).where(eq(users.id, parseInt(req.params.id)));
      res.json({ message: "User deleted successfully" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Patient Management ---
  app.get("/api/patients", authenticateToken, async (req, res) => {
    const q = req.query.q as string;
    try {
      const p = aliasedTable(patients, "p");

      const baseQuery = db.select({
        id: p.id,
        fullName: p.fullName,
        nationalId: p.nationalId,
        gender: p.gender,
        mobile: p.mobile,
        governorate: p.governorate,
        diagnosis: p.diagnosis,
        status: p.status,
        caseStatus: p.caseStatus,
        photoUrl: p.photoUrl,
        createdAt: p.createdAt,
        hospital: p.hospital,
        companionCount: sql<number>`(SELECT count(*) FROM companions c WHERE c.patient_id = p.id)`,
        totalStayDays: sql<number>`(
          SELECT COALESCE(SUM(
            CASE 
              WHEN s.status = 'completed' AND s.actual_check_out_date IS NOT NULL 
              THEN CAST((JULIANDAY(datetime(s.actual_check_out_date / 1000, 'unixepoch')) - JULIANDAY(datetime(s.check_in_date / 1000, 'unixepoch'))) AS INTEGER)
              ELSE CAST((JULIANDAY('now') - JULIANDAY(datetime(s.check_in_date / 1000, 'unixepoch'))) AS INTEGER)
            END
          ), 0) FROM stays s WHERE s.patient_id = p.id
        )`,
        totalCost: sql<number>`(
          SELECT COALESCE(SUM(i.final_amount), 0) FROM invoices i INNER JOIN stays s ON i.stay_id = s.id WHERE s.patient_id = p.id
        ) + (
          SELECT COALESCE(SUM(ss.total_cost), 0) FROM stay_services ss INNER JOIN stays s ON ss.stay_id = s.id WHERE s.patient_id = p.id AND s.status = 'active'
        )`
      }).from(p);

      let results;
      if (q) {
        results = await baseQuery
          .where(or(
            like(p.fullName, `%${q}%`), 
            like(p.nationalId, `%${q}%`),
            like(p.mobile, `%${q}%`)
          ))
          .orderBy(desc(p.createdAt));
      } else {
        results = await baseQuery.orderBy(desc(p.createdAt));
      }
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/patients", authenticateToken, authorizeRole(["admin", "reception", "data_entry", "room_supervisor"]), async (req, res) => {
    const { companions: companionsData, ...patientData } = req.body;
    try {
      const result = db.transaction((tx) => {
        const [newPatient] = tx.insert(patients).values(patientData).returning().all();
        
        if (companionsData && Array.isArray(companionsData)) {
          for (const comp of companionsData) {
            tx.insert(companions).values({
              ...comp,
              patientId: newPatient.id
            }).run();
          }
        }
        return newPatient;
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/patients/:id", authenticateToken, authorizeRole(["admin", "reception", "data_entry", "room_supervisor"]), async (req, res) => {
    try {
      const [updatedPatient] = await db.update(patients)
        .set(req.body)
        .where(eq(patients.id, parseInt(req.params.id)))
        .returning();
      res.json(updatedPatient);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/patients/:id", authenticateToken, async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const [patient] = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
      const [patientCompanions, patientStaysRaw, patientDocuments] = await Promise.all([
        db.select().from(companions).where(eq(companions.patientId, patientId)),
        db.select({
          id: stays.id,
          checkInDate: stays.checkInDate,
          expectedCheckOutDate: stays.expectedCheckOutDate,
          actualCheckOutDate: stays.actualCheckOutDate,
          status: stays.status,
          notes: stays.notes,
          letterDuration: stays.letterDuration,
          letterUrl: stays.letterUrl,
          roomNumber: rooms.roomNumber,
          bedNumber: beds.bedNumber,
          companionName: companions.fullName,
          companionRelationship: companions.relationship,
          companionMobile: companions.mobile
        })
        .from(stays)
        .leftJoin(rooms, eq(stays.roomId, rooms.id))
        .leftJoin(beds, eq(stays.bedId, beds.id))
        .leftJoin(stayCompanions, eq(stayCompanions.stayId, stays.id))
        .leftJoin(companions, eq(stayCompanions.companionId, companions.id))
        .where(eq(stays.patientId, patientId))
        .orderBy(desc(stays.checkInDate)),
        db.select().from(documents).where(eq(documents.patientId, patientId)).orderBy(desc(documents.createdAt))
      ]);

      // Group stays to handle companions from the join
      const staysMap: Record<number, any> = {};
      patientStaysRaw.forEach(row => {
        if (!staysMap[row.id]) {
          staysMap[row.id] = {
            id: row.id,
            checkInDate: row.checkInDate,
            expectedCheckOutDate: row.expectedCheckOutDate,
            actualCheckOutDate: row.actualCheckOutDate,
            status: row.status,
            notes: row.notes,
            letterDuration: row.letterDuration,
            letterUrl: row.letterUrl,
            roomNumber: row.roomNumber,
            bedNumber: row.bedNumber,
            companions: []
          };
        }
        if (row.companionName) {
          // Prevent duplicate companion entries for the same stay
          if (!staysMap[row.id].companions.find((c: any) => c.fullName === row.companionName)) {
            staysMap[row.id].companions.push({ 
              fullName: row.companionName,
              relationship: row.companionRelationship,
              mobile: row.companionMobile
            });
          }
        }
      });
      
      res.json({ 
        ...patient, 
        companions: patientCompanions, 
        stays: Object.values(staysMap).sort((a: any, b: any) => b.checkInDate - a.checkInDate), 
        documents: patientDocuments 
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/rooms", authenticateToken, authorizeRole(["admin", "room_supervisor"]), async (req, res) => {
    const { roomNumber, floor, type, capacity, building } = req.body;
    try {
      const result = db.transaction((tx) => {
        const [newRoom] = tx.insert(rooms).values({
          roomNumber: String(roomNumber),
          floor: String(floor),
          building: building || "Main",
          type,
          capacity: parseInt(capacity),
          status: "available"
        }).returning().all();

        // Automatically create beds for the room
        for (let i = 1; i <= parseInt(capacity); i++) {
          tx.insert(beds).values({
            roomId: newRoom.id,
            bedNumber: `${roomNumber}-${i}`,
            status: "available"
          }).run();
        }
        return newRoom;
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/rooms/:id", authenticateToken, authorizeRole(["admin", "room_supervisor"]), async (req, res) => {
    const roomId = parseInt(req.params.id);
    const { roomNumber, floor, type, capacity, building, status } = req.body;
    try {
      const result = db.transaction((tx) => {
        const [room] = tx.select().from(rooms).where(eq(rooms.id, roomId)).limit(1).all();
        if (!room) throw new Error("الغرفة غير موجودة");

        const currentBeds = tx.select().from(beds).where(eq(beds.roomId, roomId)).all();
        const occupiedBeds = currentBeds.filter(b => b.status === "occupied");

        let targetCapacity = room.capacity;
        if (capacity !== undefined) {
          targetCapacity = parseInt(capacity);
          if (targetCapacity < occupiedBeds.length) {
            throw new Error(`لا يمكن تقليل سعة الغرفة لأقل من عدد الأسرة المشغولة حالياً (${occupiedBeds.length})`);
          }
        }

        const updatedRoomNumber = roomNumber !== undefined ? String(roomNumber) : room.roomNumber;
        const updatedFloor = floor !== undefined ? String(floor) : room.floor;
        const updatedType = type !== undefined ? String(type) : room.type;
        const updatedBuilding = building !== undefined ? String(building) : room.building;
        const updatedStatus = (status !== undefined ? String(status) : room.status) as "available" | "occupied" | "maintenance" | "reserved";

        const [updatedRoom] = tx.update(rooms).set({
          roomNumber: updatedRoomNumber,
          floor: updatedFloor,
          type: updatedType,
          capacity: targetCapacity,
          building: updatedBuilding,
          status: updatedStatus,
        }).where(eq(rooms.id, roomId)).returning().all();

        // 1. Rename existing beds if roomNumber changed
        if (roomNumber !== undefined && roomNumber !== room.roomNumber) {
          for (let i = 0; i < currentBeds.length; i++) {
            const bed = currentBeds[i];
            const suffix = bed.bedNumber.split("-")[1] || String(i + 1);
            tx.update(beds).set({
              bedNumber: `${updatedRoomNumber}-${suffix}`
            }).where(eq(beds.id, bed.id)).run();
          }
        }

        // 2. Adjust bed count
        const currentCount = currentBeds.length;
        if (targetCapacity > currentCount) {
          for (let i = currentCount + 1; i <= targetCapacity; i++) {
            tx.insert(beds).values({
              roomId,
              bedNumber: `${updatedRoomNumber}-${i}`,
              status: "available"
            }).run();
          }
        } else if (targetCapacity < currentCount) {
          let removedCount = 0;
          const toRemove = currentCount - targetCapacity;
          const bedsSorted = [...currentBeds].sort((a, b) => b.id - a.id);
          for (const bed of bedsSorted) {
            if (removedCount >= toRemove) break;
            if (bed.status !== "occupied") {
              tx.delete(beds).where(eq(beds.id, bed.id)).run();
              removedCount++;
            }
          }
        }

        return updatedRoom;
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/rooms/:id", authenticateToken, authorizeRole(["admin", "room_supervisor"]), async (req, res) => {
    const roomId = parseInt(req.params.id);
    try {
      const result = db.transaction((tx) => {
        const activeStaysList = tx.select()
          .from(stays)
          .where(and(eq(stays.roomId, roomId), eq(stays.status, "active"))).all();

        if (activeStaysList.length > 0) {
          throw new Error("لا يمكن حذف الغرفة لوجود إقامات نشطة بها حالياً. يرجى ترحيل النزلاء أو إنهاء إقامتهم أولاً.");
        }

        tx.update(assets).set({ roomId: null }).where(eq(assets.roomId, roomId)).run();
        tx.delete(beds).where(eq(beds.roomId, roomId)).run();
        tx.delete(rooms).where(eq(rooms.id, roomId)).run();
        return { success: true };
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Companion Management ---
  app.post("/api/companions", authenticateToken, authorizeRole(["admin", "reception", "data_entry", "room_supervisor"]), async (req, res) => {
    try {
      const [newCompanion] = await db.insert(companions).values(req.body).returning();
      res.json(newCompanion);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Document Management ---
  app.post("/api/patients/:id/documents", authenticateToken, authorizeRole(["admin", "reception", "data_entry", "room_supervisor"]), async (req, res) => {
    const patientId = parseInt(req.params.id);
    const { name, category, url } = req.body;
    try {
      const [newDoc] = await db.insert(documents).values({
        patientId,
        name,
        category,
        url
      }).returning();
      res.json(newDoc);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Reports ---
  app.get("/api/reports/stays", authenticateToken, async (req, res) => {
    try {
      const resultsRaw = await db.select({
        id: stays.id,
        checkInDate: stays.checkInDate,
        actualCheckOutDate: stays.actualCheckOutDate,
        status: stays.status,
        patientName: patients.fullName,
        nationalId: patients.nationalId,
        roomNumber: rooms.roomNumber,
        floor: rooms.floor,
        building: rooms.building,
        bedNumber: beds.bedNumber,
        stayDuration: sql<number>`
          CASE 
            WHEN ${stays.status} = 'completed' AND ${stays.actualCheckOutDate} IS NOT NULL 
            THEN CAST((JULIANDAY(datetime(${stays.actualCheckOutDate} / 1000, 'unixepoch')) - JULIANDAY(datetime(${stays.checkInDate} / 1000, 'unixepoch'))) AS INTEGER)
            ELSE CAST((JULIANDAY('now') - JULIANDAY(datetime(${stays.checkInDate} / 1000, 'unixepoch'))) AS INTEGER)
          END
        `,
        serviceName: services.name,
        serviceQuantity: stayServices.quantity,
        serviceTotalCost: stayServices.totalCost
      })
      .from(stays)
      .innerJoin(patients, eq(stays.patientId, patients.id))
      .innerJoin(rooms, eq(stays.roomId, rooms.id))
      .innerJoin(beds, eq(stays.bedId, beds.id))
      .leftJoin(stayServices, eq(stayServices.stayId, stays.id))
      .leftJoin(services, eq(stayServices.serviceId, services.id))
      .orderBy(desc(stays.checkInDate));

      const reportMap: Record<number, any> = {};
      resultsRaw.forEach(row => {
        if (!reportMap[row.id]) {
          reportMap[row.id] = {
            id: row.id,
            checkInDate: row.checkInDate,
            actualCheckOutDate: row.actualCheckOutDate,
            status: row.status,
            patientName: row.patientName,
            nationalId: row.nationalId,
            roomNumber: row.roomNumber,
            floor: row.floor,
            building: row.building,
            bedNumber: row.bedNumber,
            stayDuration: row.stayDuration,
            services: []
          };
        }
        if (row.serviceName) {
          reportMap[row.id].services.push({
            name: row.serviceName,
            quantity: row.serviceQuantity,
            totalCost: row.serviceTotalCost
          });
        }
      });
      
      res.json(Object.values(reportMap));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Room & Bed Management ---
  app.get("/api/rooms", authenticateToken, async (req, res) => {
    try {
      const allRoomsRaw = await db.select({
        room: rooms,
        bed: {
          id: beds.id,
          bedNumber: beds.bedNumber,
          status: beds.status
        },
        stayId: stays.id,
        patientName: patients.fullName
      })
      .from(rooms)
      .leftJoin(beds, eq(beds.roomId, rooms.id))
      .leftJoin(stays, and(eq(stays.bedId, beds.id), eq(stays.status, "active")))
      .leftJoin(patients, eq(stays.patientId, patients.id));
      
      const roomsMap: Record<number, any> = {};
      allRoomsRaw.forEach(row => {
        const roomId = row.room.id;
        if (!roomsMap[roomId]) {
          roomsMap[roomId] = { ...row.room, beds: {} };
        }
        if (row.bed && row.bed.id) {
          const bedId = row.bed.id;
          if (!roomsMap[roomId].beds[bedId]) {
            roomsMap[roomId].beds[bedId] = {
              id: bedId,
              bedNumber: row.bed.bedNumber,
              status: row.bed.status,
              stayId: row.stayId,
              patientName: row.patientName
            };
          }
        }
      });
      
      const finalRooms = Object.values(roomsMap).map((room: any) => ({
        ...room,
        beds: Object.values(room.beds)
      }));
      res.json(finalRooms);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/rooms/:id/beds", authenticateToken, async (req, res) => {
    try {
      const roomBeds = await db.select().from(beds).where(eq(beds.roomId, parseInt(req.params.id)));
      res.json(roomBeds);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Stays (Check-in / Check-out) ---
  app.get("/api/stays/notifications", authenticateToken, async (req, res) => {
    try {
      const now = new Date();
      const upcomingLimit = new Date();
      upcomingLimit.setHours(now.getHours() + 48); // Next 48 hours

      const results = await db.select({
        id: stays.id,
        expectedCheckOutDate: stays.expectedCheckOutDate,
        patientName: patients.fullName,
        roomNumber: rooms.roomNumber,
      })
      .from(stays)
      .innerJoin(patients, eq(stays.patientId, patients.id))
      .innerJoin(rooms, eq(stays.roomId, rooms.id))
      .where(
        and(
          eq(stays.status, "active"),
          sql`${stays.expectedCheckOutDate} <= ${upcomingLimit.getTime()}`,
          sql`${stays.expectedCheckOutDate} >= ${now.getTime()}`
        )
      )
      .orderBy(stays.expectedCheckOutDate);
      
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/stays/active", authenticateToken, async (req, res) => {
    try {
      const results = await db.select({
        id: stays.id,
        checkInDate: stays.checkInDate,
        expectedCheckOutDate: stays.expectedCheckOutDate,
        status: stays.status,
        patient: patients,
        room: rooms,
        bed: beds,
      })
      .from(stays)
      .innerJoin(patients, eq(stays.patientId, patients.id))
      .innerJoin(rooms, eq(stays.roomId, rooms.id))
      .innerJoin(beds, eq(stays.bedId, beds.id))
      .where(eq(stays.status, "active"))
      .orderBy(desc(stays.checkInDate));
      
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/stays/check-in", authenticateToken, authorizeRole(["admin", "reception", "room_supervisor"]), async (req, res) => {
    const { patientId, roomId, bedId, expectedCheckOutDate, notes, admissionNotes, companionIds, mobile, referralOrg, letterDuration, letterUrl } = req.body;
    try {
      const transactionResults = db.transaction((tx) => {
        // 0. Update patient contact info if provided
        if (mobile || referralOrg) {
          tx.update(patients)
            .set({ 
              mobile: mobile || undefined, 
              referralOrg: referralOrg || undefined 
            })
            .where(eq(patients.id, patientId)).run();
        }

        // 1. Create stay
        const [newStay] = tx.insert(stays).values({
          patientId,
          roomId,
          bedId,
          expectedCheckOutDate: expectedCheckOutDate ? new Date(expectedCheckOutDate) : null,
          notes,
          admissionNotes,
          letterDuration: letterDuration ? parseInt(letterDuration) : null,
          letterUrl,
          status: "active"
        }).returning().all();

        // 2. Update bed status
        tx.update(beds).set({ status: "occupied" }).where(eq(beds.id, bedId)).run();

        // 3. Add companions if any
        if (companionIds && Array.isArray(companionIds)) {
          for (const cId of companionIds) {
            tx.insert(stayCompanions).values({
              stayId: newStay.id,
              companionId: parseInt(cId)
            }).run();
          }
        }

        return newStay;
      });
      res.json(transactionResults);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/stays/:id/renew", authenticateToken, authorizeRole(["admin", "reception", "room_supervisor"]), async (req, res) => {
    const oldStayId = parseInt(req.params.id);
    const { expectedCheckOutDate, notes, letterDuration, letterUrl } = req.body;
    try {
      const result = db.transaction((tx) => {
        const [oldStay] = tx.select().from(stays).where(eq(stays.id, oldStayId)).limit(1).all();
        if (!oldStay) throw new Error("Stay not found");

        // 1. Mark old stay as completed (or keep active but link new one? Usually one stay record per period is better)
        // Actually, many systems just EXTEND the current stay. 
        // But if they want a separate document/duration, maybe a new stay record is better for history.
        // Let's mark old as completed and create new one in same bed.
        tx.update(stays).set({
          actualCheckOutDate: new Date(),
          status: "completed",
          notes: (oldStay.notes || "") + "\n[Renewed]"
        }).where(eq(stays.id, oldStayId)).run();

        // 2. Create new stay
        const [newStay] = tx.insert(stays).values({
          patientId: oldStay.patientId,
          roomId: oldStay.roomId,
          bedId: oldStay.bedId,
          checkInDate: new Date(),
          expectedCheckOutDate: expectedCheckOutDate ? new Date(expectedCheckOutDate) : null,
          notes,
          letterDuration: letterDuration ? parseInt(letterDuration) : null,
          letterUrl,
          parentStayId: oldStayId,
          status: "active"
        }).returning().all();

        // 3. Copy companions from old stay
        const oldComps = tx.select().from(stayCompanions).where(eq(stayCompanions.stayId, oldStayId)).all();
        for (const comp of oldComps) {
          tx.insert(stayCompanions).values({
            stayId: newStay.id,
            companionId: comp.companionId
          }).run();
        }

        return newStay;
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/stays/:id/companions", authenticateToken, authorizeRole(["admin", "reception", "room_supervisor"]), async (req, res) => {
    const stayId = parseInt(req.params.id);
    const { companionIds } = req.body;
    try {
      if (companionIds && Array.isArray(companionIds)) {
        db.transaction((tx) => {
          for (const cId of companionIds) {
            // Check if already linked to prevent duplicates
            const [existing] = tx.select()
              .from(stayCompanions)
              .where(and(eq(stayCompanions.stayId, stayId), eq(stayCompanions.companionId, parseInt(cId))))
              .limit(1).all();
            
            if (!existing) {
              tx.insert(stayCompanions).values({
                stayId,
                companionId: parseInt(cId)
              }).run();
            }
          }
        });
      }
      res.json({ message: "Companions linked to stay successfully" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/stays/:id/check-out", authenticateToken, authorizeRole(["admin", "reception", "room_supervisor"]), async (req, res) => {
    const { actualCheckOutDate, notes, dischargeNotes } = req.body;
    const stayId = parseInt(req.params.id);
    try {
      db.transaction((tx) => {
        const [stay] = tx.select().from(stays).where(eq(stays.id, stayId)).limit(1).all();
        if (!stay) throw new Error("Stay not found");

        // 1. Update stay
        tx.update(stays).set({
          actualCheckOutDate: actualCheckOutDate ? new Date(actualCheckOutDate) : new Date(),
          status: "completed",
          notes: notes || stay.notes,
          dischargeNotes: dischargeNotes
        }).where(eq(stays.id, stayId)).run();

        // 2. Free the bed
        tx.update(beds).set({ status: "available" }).where(eq(beds.id, stay.bedId)).run();

        // 3. Generate invoice draft
        const checkIn = new Date(stay.checkInDate);
        const checkOut = actualCheckOutDate ? new Date(actualCheckOutDate) : new Date();
        const diffDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)) || 1;
        
        // Count companions for this stay
        const comps = tx.select({ count: sql<number>`count(*)` })
          .from(stayCompanions)
          .where(eq(stayCompanions.stayId, stayId)).all();
        const companionCount = comps[0]?.count || 0;

        const dailyRate = 50.0; 
        const roomTotal = diffDays * dailyRate * (1 + companionCount);

        // Sum of services used during stay
        const [servicesSum] = tx.select({ total: sql<number>`SUM(total_cost)` })
          .from(stayServices)
          .where(eq(stayServices.stayId, stayId)).all();
        const servicesTotal = servicesSum?.total || 0;
        
        const totalAmount = roomTotal + servicesTotal;

        tx.insert(invoices).values({
          stayId,
          totalAmount: totalAmount,
          finalAmount: totalAmount,
          status: "unpaid"
        }).run();
      });
      res.json({ message: "Checked out successfully" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Finance ---
  app.get("/api/finance/summary", authenticateToken, async (req, res) => {
    const from = req.query.from ? new Date(req.query.from as string) : null;
    const to = req.query.to ? new Date(req.query.to as string) : null;

    try {
      const filters = [];
      if (from) filters.push(sql`${invoices.createdAt} >= ${from.getTime()}`);
      if (to) filters.push(sql`${invoices.createdAt} <= ${to.getTime()}`);

      const [summary] = await db.select({
        totalRevenue: sql<number>`SUM(total_amount)`,
        paidAmount: sql<number>`SUM(CASE WHEN status = 'paid' THEN final_amount ELSE 0 END)`,
        unpaidAmount: sql<number>`SUM(CASE WHEN status = 'unpaid' THEN final_amount ELSE 0 END)`,
        count: sql<number>`COUNT(*)`
      })
      .from(invoices)
      .where(filters.length > 0 ? and(...filters) : undefined);

      res.json(summary || { totalRevenue: 0, paidAmount: 0, unpaidAmount: 0, count: 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/finance/invoices", authenticateToken, async (req, res) => {
    const from = req.query.from ? new Date(req.query.from as string) : null;
    const to = req.query.to ? new Date(req.query.to as string) : null;
    const q = req.query.q as string;

    try {
      const filters = [];
      if (from) filters.push(sql`${invoices.createdAt} >= ${from.getTime()}`);
      if (to) filters.push(sql`${invoices.createdAt} <= ${to.getTime()}`);
      
      const results = await db.select({
        id: invoices.id,
        totalAmount: invoices.totalAmount,
        finalAmount: invoices.finalAmount,
        status: invoices.status,
        createdAt: invoices.createdAt,
        patientName: patients.fullName,
      })
      .from(invoices)
      .innerJoin(stays, eq(invoices.stayId, stays.id))
      .innerJoin(patients, eq(stays.patientId, patients.id))
      .where(and(
        filters.length > 0 ? and(...filters) : undefined,
        q ? or(like(patients.fullName, `%${q}%`), like(patients.nationalId, `%${q}%`)) : undefined
      ))
      .orderBy(desc(invoices.createdAt));

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Services ---
  app.get("/api/services", authenticateToken, async (req, res) => {
    try {
      const allServices = await db.select().from(services);
      res.json(allServices);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/services", authenticateToken, authorizeRole(["admin", "financial_manager"]), async (req, res) => {
    const { name, category, unitCost } = req.body;
    try {
      const [newService] = await db.insert(services).values({
        name,
        category,
        unitCost: parseFloat(unitCost)
      }).returning();
      res.json(newService);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/services/:id", authenticateToken, authorizeRole(["admin", "data_entry", "financial_manager"]), async (req, res) => {
    const { name, category, unitCost } = req.body;
    try {
      const [updatedService] = await db.update(services)
        .set({
          name,
          category,
          unitCost: unitCost !== undefined ? parseFloat(unitCost) : undefined
        })
        .where(eq(services.id, parseInt(req.params.id)))
        .returning();
      res.json(updatedService);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/stays/:id/services", authenticateToken, async (req, res) => {
    const stayId = parseInt(req.params.id);
    try {
      const results = await db.select({
        id: stayServices.id,
        quantity: stayServices.quantity,
        totalCost: stayServices.totalCost,
        notes: stayServices.notes,
        serviceDate: stayServices.serviceDate,
        serviceName: services.name,
        category: services.category
      })
      .from(stayServices)
      .innerJoin(services, eq(stayServices.serviceId, services.id))
      .where(eq(stayServices.stayId, stayId))
      .orderBy(desc(stayServices.serviceDate));
      
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/stays/:id/services", authenticateToken, authorizeRole(["admin", "reception", "data_entry", "financial_manager", "room_supervisor"]), async (req, res) => {
    const { serviceId, quantity, notes, totalCostOverride } = req.body;
    const stayId = parseInt(req.params.id);
    try {
      const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
      if (!service) return res.status(404).json({ error: "Service not found" });

      const finalTotalCost = totalCostOverride !== undefined ? parseFloat(totalCostOverride) : service.unitCost * (quantity || 1);
      
      const [newStayService] = await db.insert(stayServices).values({
        stayId,
        serviceId,
        quantity: quantity || 1,
        totalCost: finalTotalCost,
        notes: notes,
        serviceDate: new Date()
      }).returning();

      res.json(newStayService);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- System Settings ---
  app.get("/api/settings", authenticateToken, async (req, res) => {
    try {
      const allSettings = await db.select().from(appSettings);
      // Convert to key-value object for easier frontend use
      const settingsMap = allSettings.reduce((acc: any, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/settings", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
    const settings = req.body; // Expecting { key: value, ... }
    try {
      db.transaction((tx) => {
        for (const [key, value] of Object.entries(settings)) {
          const [existing] = tx.select().from(appSettings).where(eq(appSettings.key, key)).limit(1).all();
          if (existing) {
            tx.update(appSettings).set({ value: String(value), updatedAt: new Date() }).where(eq(appSettings.key, key)).run();
          } else {
            tx.insert(appSettings).values({ key, value: String(value) }).run();
          }
        }
      });
      res.json({ message: "تم تحديث الإعدادات بنجاح" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Inventory Management ---
  app.get("/api/inventory", authenticateToken, async (req, res) => {
    try {
      const items = await db.select().from(inventoryItems).orderBy(inventoryItems.name);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory", authenticateToken, authorizeRole(["admin", "room_supervisor", "data_entry"]), async (req, res) => {
    try {
      const { name, category, unit, minQuantity, currentQuantity, pricePerUnit } = req.body;
      const [newItem] = await db.insert(inventoryItems).values({
        name,
        category,
        unit,
        minQuantity: parseInt(minQuantity) || 0,
        currentQuantity: parseInt(currentQuantity) || 0,
        pricePerUnit: parseFloat(pricePerUnit) || 0,
        updatedAt: new Date()
      }).returning();
      res.json(newItem);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/inventory/transactions", authenticateToken, async (req, res) => {
    try {
      const transactions = await db.select({
        id: inventoryTransactions.id,
        itemId: inventoryTransactions.itemId,
        itemName: inventoryItems.name,
        type: inventoryTransactions.type,
        quantity: inventoryTransactions.quantity,
        reason: inventoryTransactions.reason,
        performedByName: users.name,
        transactionDate: inventoryTransactions.transactionDate
      })
      .from(inventoryTransactions)
      .innerJoin(inventoryItems, eq(inventoryTransactions.itemId, inventoryItems.id))
      .innerJoin(users, eq(inventoryTransactions.performedBy, users.id))
      .orderBy(desc(inventoryTransactions.transactionDate))
      .limit(100);
      
      res.json(transactions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/inventory/:id/transactions", authenticateToken, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const transactions = await db.select({
        id: inventoryTransactions.id,
        type: inventoryTransactions.type,
        quantity: inventoryTransactions.quantity,
        reason: inventoryTransactions.reason,
        performedByName: users.name,
        transactionDate: inventoryTransactions.transactionDate
      })
      .from(inventoryTransactions)
      .innerJoin(users, eq(inventoryTransactions.performedBy, users.id))
      .where(eq(inventoryTransactions.itemId, itemId))
      .orderBy(desc(inventoryTransactions.transactionDate));
      
      res.json(transactions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory/:id/transaction", authenticateToken, authorizeRole(["admin", "room_supervisor", "data_entry"]), async (req, res) => {
    const itemId = parseInt(req.params.id);
    const { type, quantity, reason } = req.body;
    const userId = (req as any).user.id;

    try {
      const result = db.transaction((tx) => {
        const [item] = tx.select().from(inventoryItems).where(eq(inventoryItems.id, itemId)).limit(1).all();
        if (!item) throw new Error("Item not found");

        const qty = parseInt(quantity);
        const newTotal = type === "in" ? item.currentQuantity + qty : item.currentQuantity - qty;

        if (newTotal < 0) throw new Error("Insufficient stock");

        tx.update(inventoryItems).set({
          currentQuantity: newTotal,
          updatedAt: new Date()
        }).where(eq(inventoryItems.id, itemId)).run();

        const [transaction] = tx.insert(inventoryTransactions).values({
          itemId,
          type,
          quantity: qty,
          reason,
          performedBy: userId,
          transactionDate: new Date()
        }).returning().all();

        return transaction;
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/inventory/:id", authenticateToken, authorizeRole(["admin", "room_supervisor", "data_entry"]), async (req, res) => {
    const itemId = parseInt(req.params.id);
    try {
      const { name, category, unit, minQuantity, currentQuantity, pricePerUnit } = req.body;
      const [updatedItem] = await db.update(inventoryItems).set({
        name,
        category,
        unit,
        minQuantity: parseInt(minQuantity) || 0,
        currentQuantity: parseInt(currentQuantity) || 0,
        pricePerUnit: parseFloat(pricePerUnit) || 0,
        updatedAt: new Date()
      }).where(eq(inventoryItems.id, itemId)).returning();
      
      if (!updatedItem) {
        return res.status(404).json({ error: "الصنف غير موجود" });
      }
      res.json(updatedItem);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/inventory/:id", authenticateToken, authorizeRole(["admin", "room_supervisor"]), async (req, res) => {
    const itemId = parseInt(req.params.id);
    try {
      const result = db.transaction((tx) => {
        tx.delete(inventoryTransactions).where(eq(inventoryTransactions.itemId, itemId)).run();
        tx.delete(inventoryItems).where(eq(inventoryItems.id, itemId)).run();
        return { success: true };
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Asset & Maintenance Management ---
  app.get("/api/assets", authenticateToken, async (req, res) => {
    try {
      const allAssets = await db.select({
        id: assets.id,
        name: assets.name,
        category: assets.category,
        status: assets.status,
        roomNumber: rooms.roomNumber,
        purchaseDate: assets.purchaseDate,
        purchaseCost: assets.purchaseCost,
        serialNumber: assets.serialNumber
      })
      .from(assets)
      .leftJoin(rooms, eq(assets.roomId, rooms.id));
      res.json(allAssets);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/assets", authenticateToken, authorizeRole(["admin", "room_supervisor"]), async (req, res) => {
    try {
      const { name, category, roomId, purchaseDate, purchaseCost, lifespanMonths, serialNumber, description } = req.body;
      const [newAsset] = await db.insert(assets).values({
        name,
        category,
        roomId: roomId ? parseInt(roomId) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost: parseFloat(purchaseCost) || 0,
        lifespanMonths: parseInt(lifespanMonths) || 60,
        serialNumber,
        description,
        status: "active"
      }).returning();
      res.json(newAsset);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/assets/:id/maintenance", authenticateToken, async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const schedules = await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.assetId, assetId));
      const logs = await db.select().from(maintenanceLogs).where(eq(maintenanceLogs.assetId, assetId)).orderBy(desc(maintenanceLogs.actionDate));
      res.json({ schedules, logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/assets/:id/maintenance-schedule", authenticateToken, authorizeRole(["admin", "room_supervisor"]), async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      const { taskName, frequencyDays, nextMaintenanceDate, assignedTo } = req.body;
      const [newSchedule] = await db.insert(maintenanceSchedules).values({
        assetId,
        taskName,
        frequencyDays: parseInt(frequencyDays),
        nextMaintenanceDate: new Date(nextMaintenanceDate),
        assignedTo
      }).returning();
      res.json(newSchedule);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/maintenance-logs", authenticateToken, authorizeRole(["admin", "room_supervisor"]), async (req, res) => {
    try {
      const { assetId, scheduleId, actionTaken, result, cost, performedBy, notes } = req.body;
      
      const result_data = db.transaction((tx) => {
        const [log] = tx.insert(maintenanceLogs).values({
          assetId: parseInt(assetId),
          scheduleId: scheduleId ? parseInt(scheduleId) : null,
          actionTaken,
          result,
          cost: parseFloat(cost) || 0,
          performedBy,
          notes,
          actionDate: new Date()
        }).returning().all();

        if (scheduleId) {
          const [schedule] = tx.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.id, parseInt(scheduleId))).limit(1).all();
          if (schedule) {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + schedule.frequencyDays);
            tx.update(maintenanceSchedules).set({
              lastMaintenanceDate: new Date(),
              nextMaintenanceDate: nextDate
            }).where(eq(maintenanceSchedules.id, schedule.id)).run();
          }
        }

        return log;
      });
      
      res.json(result_data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/maintenance/overview", authenticateToken, async (req, res) => {
    try {
      const upcoming = await db.select({
        id: maintenanceSchedules.id,
        taskName: maintenanceSchedules.taskName,
        nextMaintenanceDate: maintenanceSchedules.nextMaintenanceDate,
        assetName: assets.name,
        assetId: assets.id
      })
      .from(maintenanceSchedules)
      .innerJoin(assets, eq(maintenanceSchedules.assetId, assets.id))
      .where(sql`${maintenanceSchedules.nextMaintenanceDate} <= ${new Date(Date.now() + 7 * 24 * 3600 * 1000).getTime()}`) // Next 7 days
      .orderBy(maintenanceSchedules.nextMaintenanceDate);

      res.json(upcoming);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Dashboard Data ---
  app.get("/api/dashboard/charts", authenticateToken, async (req, res) => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      }).reverse();

      const chartData = await Promise.all(last7Days.map(async (date) => {
        const startOfDay = date.getTime();
        const endOfDay = startOfDay + 24 * 3600 * 1000 - 1;

        const dayName = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);

        const [admissions, discharges, revenue] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(stays).where(and(gte(stays.checkInDate, new Date(startOfDay)), lte(stays.checkInDate, new Date(endOfDay)))),
          db.select({ count: sql<number>`count(*)` }).from(stays).where(and(eq(stays.status, "completed"), gte(stays.actualCheckOutDate, new Date(startOfDay)), lte(stays.actualCheckOutDate, new Date(endOfDay)))),
          db.select({ sum: sql<number>`sum(final_amount)` }).from(invoices).where(and(gte(invoices.createdAt, new Date(startOfDay)), lte(invoices.createdAt, new Date(endOfDay))))
        ]);

        return {
          name: dayName,
          admissions: admissions[0]?.count || 0,
          discharges: discharges[0]?.count || 0,
          revenue: revenue[0]?.sum || 0
        };
      }));

      res.json(chartData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const [
        patientsCountResult, 
        companionsCountResult, 
        occupiedRoomsResult, 
        totalRoomsResult, 
        activeStaysResult, 
        totalRevenueFinalResult
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(patients),
        db.select({ count: sql<number>`count(*)` }).from(companions),
        db.select({ count: sql<number>`count(distinct room_id)` }).from(stays).where(eq(stays.status, "active")),
        db.select({ count: sql<number>`count(*)` }).from(rooms),
        db.select({ count: sql<number>`count(*)` }).from(stays).where(eq(stays.status, "active")),
        db.select({
          sum: sql<number>`
            COALESCE((SELECT SUM(total_amount) FROM invoices), 0) + 
            COALESCE((SELECT SUM(ss.total_cost) FROM stay_services ss INNER JOIN stays s ON ss.stay_id = s.id WHERE s.status = 'active'), 0)
          `
        }).from(sql`(SELECT 1) as dummy`)
      ]);
      
      const totalRevenue = totalRevenueFinalResult[0]?.sum || 0;

      res.json({
        totalPatients: patientsCountResult[0].count,
        totalCompanions: companionsCountResult[0].count,
        occupiedRooms: occupiedRoomsResult[0].count,
        availableRooms: totalRoomsResult[0].count - occupiedRoomsResult[0].count,
        currentStays: activeStaysResult[0].count,
        totalRevenue: totalRevenue
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
