import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      standards,
      gudang,
      surveys,
      daftung,
      workorders,
      kontrakJasa,
      kontrakMaterial,
      vendorTiang,
      pickupHistory
    ] = await Promise.all([
      prisma.standardKonstruksi.findMany({ orderBy: { name: 'asc' } }),
      prisma.gudangMaterial.findMany({ orderBy: { description: 'asc' } }),
      prisma.survey.findMany({ orderBy: { updated: 'desc' } }),
      prisma.daftung.findMany({ orderBy: { durasiHariKerja: 'desc' } }),
      prisma.workOrder.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.kontrakJasa.findMany({ orderBy: { no: 'asc' } }),
      prisma.kontrakMaterial.findMany({ orderBy: { no: 'asc' } }),
      prisma.vendorTiangMaster.findMany({ orderBy: { name: 'asc' } }),
      prisma.vendorPickupHistory.findMany({ orderBy: { createdAt: 'desc' } })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        standards: standards.map(s => ({
          id: s.id,
          name: s.name,
          active: s.active,
          materials: JSON.parse(s.materials || '{}')
        })),
        gudang: gudang.map(g => ({
          material: g.material,
          description: g.description,
          sap: g.sap,
          fisik: g.fisik,
          unit: g.unit,
          keterangan: g.keterangan
        })),
        surveys: surveys.map(s => ({
          id: s.id,
          status: s.status,
          surveyor: s.surveyor,
          customer: JSON.parse(s.customer || '{}'),
          technical: JSON.parse(s.technical || '{}'),
          location: JSON.parse(s.location || '{}'),
          standardSelections: JSON.parse(s.standardSelections || '[]'),
          materials: JSON.parse(s.materials || '[]'),
          sourceLegacy: s.sourceLegacy,
          supersededBy: s.supersededBy,
          daftungId: s.daftungId,
          created: s.created,
          updated: s.updated
        })),
        daftung: daftung.map(d => ({
          id: d.id,
          idpel: d.idpel,
          nama: d.nama,
          alamat: d.alamat,
          tarifLama: d.tarifLama,
          dayaLama: d.dayaLama,
          tarif: d.tarif,
          daya: d.daya,
          jenisTransaksi: d.jenisTransaksi,
          woTiang: d.woTiang,
          noWo: d.noWo,
          penyediaJasa: d.penyediaJasa,
          pengawas: d.pengawas,
          tglBayar: d.tglBayar,
          durasiHariKerja: d.durasiHariKerja,
          kriteriaTmp: d.kriteriaTmp,
          statusPermohonan: d.statusPermohonan,
          namaup: d.namaup,
          surveyId: d.surveyId,
          sumber: d.sumber,
          statusDaftung: d.statusDaftung,
          nidi: d.nidi,
          slo: d.slo
        })),
        workorders: workorders.map(w => ({
          noWo: w.noWo,
          namaPelanggan: w.namaPelanggan,
          vendor: w.vendor,
          pengawas: w.pengawas,
          pengawas2: w.pengawas2,
          status: w.status,
          ketKendala: w.ketKendala,
          daftungId: w.daftungId,
          surveyId: w.surveyId,
          idpel: w.idpel,
          kontrakJasa: w.kontrakJasa,
          nilaiJasa: w.nilaiJasa,
          vendorTiang: w.vendorTiang,
          materials: JSON.parse(w.materials || '[]'),
          jasaProgress: JSON.parse(w.jasaProgress || '{}'),
          jasaWeights: JSON.parse(w.jasaWeights || '{}'),
          tiangRows: JSON.parse(w.tiangRows || '[]'),
          bast: JSON.parse(w.bast || '{}'),
          vendorToken: w.vendorToken || '',
          vendorApproved: Boolean(w.vendorApproved),
          vendorCatatan: w.vendorCatatan || '',
          tglPemeriksaanPengawas: w.tglPemeriksaanPengawas || ''
        })),
        kontrakJasa: kontrakJasa.map(k => ({
          no: k.no,
          pt: k.pt,
          desc: k.desc,
          awal: k.awal,
          akhir: k.akhir,
          nilai: k.nilai
        })),
        kontrakMaterial: kontrakMaterial.map(k => ({
          no: k.no,
          pt: k.pt,
          desc: k.desc,
          awal: k.awal,
          akhir: k.akhir,
          nilai: k.nilai,
          materials: JSON.parse(k.materials || '[]')
        })),
        vendorTiang: vendorTiang.map(v => v.name),
        pickupHistory: pickupHistory.map(p => ({
          id: p.id,
          date: p.date,
          woNo: p.woNo,
          vendor: p.vendor,
          material: p.material,
          qty: p.qty,
          sj: p.sj,
          verified: p.verified,
          proofName: p.proofName
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching promotor data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      // 1. SURVEY ACTIONS
      case 'SAVE_SURVEY': {
        const { record } = payload;
        const s = await prisma.survey.upsert({
          where: { id: record.id },
          update: {
            status: record.status,
            surveyor: record.surveyor,
            customer: JSON.stringify(record.customer || {}),
            technical: JSON.stringify(record.technical || {}),
            location: JSON.stringify(record.location || {}),
            standardSelections: JSON.stringify(record.standardSelections || []),
            materials: JSON.stringify(record.materials || []),
            updated: new Date().toISOString().slice(0, 10)
          },
          create: {
            id: record.id,
            status: record.status,
            surveyor: record.surveyor,
            customer: JSON.stringify(record.customer || {}),
            technical: JSON.stringify(record.technical || {}),
            location: JSON.stringify(record.location || {}),
            standardSelections: JSON.stringify(record.standardSelections || []),
            materials: JSON.stringify(record.materials || []),
            created: new Date().toISOString().slice(0, 10),
            updated: new Date().toISOString().slice(0, 10)
          }
        });
        return NextResponse.json({ success: true, data: s });
      }

      case 'MOVE_SURVEY_TO_DAFTUNG': {
        const { surveyId } = payload;
        const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
        if (!survey) throw new Error('Survey tidak ditemukan');

        const cust = JSON.parse(survey.customer || '{}');
        const tech = JSON.parse(survey.technical || '{}');
        const count = await prisma.daftung.count();
        const dtId = `DT-${String(count + 1).padStart(4, '0')}`;

        const daftung = await prisma.daftung.create({
          data: {
            id: dtId,
            idpel: cust.idpel || `TMP-${Date.now().toString().slice(-6)}`,
            nama: cust.name,
            alamat: cust.address || '',
            daya: Number(cust.daya) || 0,
            tarif: cust.tarif || '',
            jenisTransaksi: cust.jenis || 'PASANG BARU',
            namaup: tech.ulp || '',
            tglBayar: new Date().toISOString().slice(0, 10),
            durasiHariKerja: 0,
            kriteriaTmp: '24 Hari',
            surveyId: survey.id,
            sumber: 'SURVEY',
            statusDaftung: 'Siap WO'
          }
        });

        await prisma.survey.update({
          where: { id: surveyId },
          data: { daftungId: dtId, status: 'Selesai' }
        });

        return NextResponse.json({ success: true, data: daftung });
      }

      // 2. DAFTUNG ACTIONS
      case 'SAVE_MANUAL_DAFTUNG': {
        const { record } = payload;
        const count = await prisma.daftung.count();
        const dtId = `DT-${String(count + 1).padStart(4, '0')}`;

        const d = await prisma.daftung.create({
          data: {
            id: dtId,
            idpel: record.idpel,
            nama: record.nama,
            alamat: record.alamat || '',
            daya: Number(record.daya) || 0,
            tarif: record.tarif || '',
            jenisTransaksi: record.jenisTransaksi || 'PASANG BARU',
            namaup: record.namaup || '',
            tglBayar: new Date().toISOString().slice(0, 10),
            durasiHariKerja: 0,
            kriteriaTmp: '24 Hari',
            sumber: 'MANUAL',
            statusDaftung: 'Siap WO'
          }
        });
        return NextResponse.json({ success: true, data: d });
      }

      case 'UPDATE_DAFTUNG_IDPEL': {
        const { id, idpel } = payload;
        const d = await prisma.daftung.update({
          where: { id },
          data: { idpel }
        });
        return NextResponse.json({ success: true, data: d });
      }

      case 'TOGGLE_DAFTUNG_FLAG': {
        const { id, flag, value } = payload;
        const updateData: Record<string, boolean> = {};
        if (flag === 'nidi') updateData.nidi = value;
        if (flag === 'slo') updateData.slo = value;

        const d = await prisma.daftung.update({
          where: { id },
          data: updateData
        });
        return NextResponse.json({ success: true, data: d });
      }

      // 3. WORK ORDER & APPLY WO
      case 'CREATE_WO_FROM_DAFTUNG': {
        const { daftungId, noWo, vendor, pengawas, pengawas2, kontrakJasa, nilaiJasa, vendorTiang, materials, tiangRows } = payload;
        
        const wo = await prisma.workOrder.create({
          data: {
            noWo,
            namaPelanggan: payload.namaPelanggan,
            vendor,
            pengawas,
            pengawas2: pengawas2 || '',
            status: 'Aktif',
            daftungId,
            surveyId: payload.surveyId || '',
            idpel: payload.idpel || '',
            kontrakJasa,
            nilaiJasa: Number(nilaiJasa) || 0,
            vendorTiang: vendorTiang || '',
            materials: JSON.stringify(materials || []),
            jasaProgress: JSON.stringify({ tiang: false, konstruksi: false, penarikan: false, kerangka: false, trafo_app: false }),
            jasaWeights: JSON.stringify({ tiang: 20, konstruksi: 20, penarikan: 20, kerangka: 20, trafo_app: 20 }),
            tiangRows: JSON.stringify(tiangRows || []),
            bast: JSON.stringify({ conditions: {}, asmanKonstruksi: '', asmanJaringan: '' })
          }
        });

        await prisma.daftung.update({
          where: { id: daftungId },
          data: {
            noWo,
            penyediaJasa: vendor,
            pengawas,
            statusDaftung: 'WO Proses'
          }
        });

        return NextResponse.json({ success: true, data: wo });
      }

      case 'UPDATE_WO_MATERIALS': {
        const { noWo, materials } = payload;
        const wo = await prisma.workOrder.update({
          where: { noWo },
          data: { materials: JSON.stringify(materials) }
        });
        return NextResponse.json({ success: true, data: wo });
      }

      case 'UPDATE_WO_JASA_PROGRESS': {
        const { noWo, jasaProgress, jasaWeights } = payload;
        const updateObj: Record<string, string> = {};
        if (jasaProgress) updateObj.jasaProgress = JSON.stringify(jasaProgress);
        if (jasaWeights) updateObj.jasaWeights = JSON.stringify(jasaWeights);

        const wo = await prisma.workOrder.update({
          where: { noWo },
          data: updateObj
        });
        return NextResponse.json({ success: true, data: wo });
      }

      case 'UPDATE_WO_TIANG': {
        const { noWo, tiangRows } = payload;
        const wo = await prisma.workOrder.update({
          where: { noWo },
          data: { tiangRows: JSON.stringify(tiangRows) }
        });
        return NextResponse.json({ success: true, data: wo });
      }

      case 'UPDATE_WORK_ORDER': {
        const { noWo, vendor, pengawas, pengawas2, vendorTiang, ketKendala } = payload;
        const updateData: any = {};
        if (vendor !== undefined) updateData.vendor = vendor;
        if (pengawas !== undefined) updateData.pengawas = pengawas;
        if (pengawas2 !== undefined) updateData.pengawas2 = pengawas2;
        if (vendorTiang !== undefined) updateData.vendorTiang = vendorTiang;
        if (ketKendala !== undefined) updateData.ketKendala = ketKendala;

        const wo = await prisma.workOrder.update({
          where: { noWo },
          data: updateData
        });

        // Also sync vendor/pengawas back to Daftung if linked
        if (wo.daftungId && (vendor || pengawas)) {
          const dUpdate: any = {};
          if (vendor) dUpdate.penyediaJasa = vendor;
          if (pengawas) dUpdate.pengawas = pengawas;
          await prisma.daftung.updateMany({
            where: { id: wo.daftungId },
            data: dUpdate
          });
        }

        return NextResponse.json({ success: true, data: wo });
      }

      case 'UPDATE_WO_KENDALA': {
        const { noWo, ketKendala } = payload;
        const wo = await prisma.workOrder.update({
          where: { noWo },
          data: { ketKendala }
        });
        return NextResponse.json({ success: true, data: wo });
      }

      case 'SAVE_BAST': {
        const { noWo, bast } = payload;
        const wo = await prisma.workOrder.update({
          where: { noWo },
          data: { bast: JSON.stringify(bast), status: 'Selesai' }
        });
        return NextResponse.json({ success: true, data: wo });
      }

      case 'APPROVE_WO_VENDOR': {
        const { noWo, vendorToken, vendorApproved, tglPemeriksaanPengawas } = payload;
        const wo = await prisma.workOrder.update({
          where: { noWo },
          data: {
            vendorToken,
            vendorApproved: Boolean(vendorApproved),
            tglPemeriksaanPengawas: tglPemeriksaanPengawas || new Date().toISOString().split('T')[0]
          }
        });
        return NextResponse.json({ success: true, data: wo });
      }

      case 'UPDATE_WO_VENDOR_CATATAN': {
        const { noWo, catatan } = payload;
        const wo = await prisma.workOrder.update({
          where: { noWo },
          data: { vendorCatatan: catatan }
        });
        return NextResponse.json({ success: true, data: wo });
      }

      // 4. KONTRAK ACTIONS
      case 'SAVE_KONTRAK_JASA': {
        const { record } = payload;
        const k = await prisma.kontrakJasa.upsert({
          where: { no: record.no },
          update: {
            pt: record.pt,
            desc: record.desc,
            awal: record.awal,
            akhir: record.akhir,
            nilai: Number(record.nilai) || 0
          },
          create: {
            no: record.no,
            pt: record.pt,
            desc: record.desc,
            awal: record.awal,
            akhir: record.akhir,
            nilai: Number(record.nilai) || 0
          }
        });
        return NextResponse.json({ success: true, data: k });
      }

      case 'SAVE_KONTRAK_MATERIAL': {
        const { record } = payload;
        const k = await prisma.kontrakMaterial.upsert({
          where: { no: record.no },
          update: {
            pt: record.pt,
            desc: record.desc,
            awal: record.awal,
            akhir: record.akhir,
            nilai: Number(record.nilai) || 0,
            materials: JSON.stringify(record.materials || [])
          },
          create: {
            no: record.no,
            pt: record.pt,
            desc: record.desc,
            awal: record.awal,
            akhir: record.akhir,
            nilai: Number(record.nilai) || 0,
            materials: JSON.stringify(record.materials || [])
          }
        });
        return NextResponse.json({ success: true, data: k });
      }

      case 'TOGGLE_KONTRAK_MATERIAL_CHECK': {
        const { contractNo, materialCode, checked } = payload;
        const c = await prisma.kontrakMaterial.findUnique({ where: { no: contractNo } });
        if (!c) throw new Error('Kontrak tidak ditemukan');
        const mats = JSON.parse(c.materials || '[]');
        const target = mats.find((m: any) => m.code === materialCode);
        if (target) target.checked = checked;
        await prisma.kontrakMaterial.update({
          where: { no: contractNo },
          data: { materials: JSON.stringify(mats) }
        });
        return NextResponse.json({ success: true, data: mats });
      }

      // 5. VENDOR ACTIONS
      case 'PROCESS_VENDOR_PICKUP': {
        const { pickups } = payload; // Array of { woNo, vendor, material, qty, sj, proofName }
        for (const p of pickups) {
          await prisma.vendorPickupHistory.create({
            data: {
              date: new Date().toISOString().slice(0, 10),
              woNo: p.woNo,
              vendor: p.vendor,
              material: p.material,
              qty: p.qty,
              sj: p.sj,
              verified: false,
              proofName: p.proofName || ''
            }
          });
        }
        return NextResponse.json({ success: true });
      }

      case 'VERIFY_VENDOR_PROOF': {
        const { sj } = payload;
        await prisma.vendorPickupHistory.updateMany({
          where: { sj },
          data: { verified: true }
        });
        return NextResponse.json({ success: true });
      }

      case 'SAVE_VENDOR_TIANG': {
        const { name } = payload;
        const v = await prisma.vendorTiangMaster.upsert({
          where: { name },
          update: {},
          create: { name }
        });
        return NextResponse.json({ success: true, data: v });
      }

      // 6. GUDANG ACTIONS
      case 'UPDATE_GUDANG_STOK': {
        const { material, sap, fisik } = payload;
        const g = await prisma.gudangMaterial.update({
          where: { material },
          data: { sap: Number(sap) || 0, fisik: Number(fisik) || 0 }
        });
        return NextResponse.json({ success: true, data: g });
      }

      // 7. STANDARD KONSTRUKSI
      case 'UPDATE_STANDARD_QTY': {
        const { name, materials, active } = payload;
        const s = await prisma.standardKonstruksi.upsert({
          where: { name },
          update: {
            materials: JSON.stringify(materials),
            active: active !== undefined ? active : true
          },
          create: {
            name,
            materials: JSON.stringify(materials),
            active: active !== undefined ? active : true
          }
        });
        return NextResponse.json({ success: true, data: s });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API Promotor POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
