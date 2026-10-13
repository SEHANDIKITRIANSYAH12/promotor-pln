import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mockStore } from '@/lib/mockStore';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const token = decodeURIComponent(params.token);

  try {
    // Find WO by vendorToken or noWo in database
    let wo = await prisma.workOrder.findFirst({
      where: {
        OR: [
          { vendorToken: token },
          { noWo: token }
        ]
      }
    });

    if (!wo) {
      // Check fallback store
      const mockWO = mockStore.findWOByTokenOrNo(token);
      if (!mockWO) {
        return NextResponse.json({ success: false, error: 'Link Perintah Kerja (WO) tidak valid atau sudah kedaluwarsa.' }, { status: 404 });
      }
      const daftung = mockStore.daftung.find(d => d.id === mockWO.daftungId) || null;
      const pickups = mockStore.pickupHistory.filter(p => p.woNo === mockWO.noWo);
      const isReserved = Boolean(mockWO.vendorApproved) || (mockWO.materials || []).some(m => (Number(m.reserved) || 0) > 0);
      return NextResponse.json({
        success: true,
        data: {
          isReserved,
          workOrder: mockWO,
          daftung,
          pickups
        },
        isFallback: true
      });
    }

    // Get linked Daftung info
    let daftung = null;
    if (wo.daftungId) {
      daftung = await prisma.daftung.findUnique({
        where: { id: wo.daftungId }
      });
    }

    // Get pickups for this WO
    const pickups = await prisma.vendorPickupHistory.findMany({
      where: { woNo: wo.noWo },
      orderBy: { createdAt: 'desc' }
    });

    const parsedMaterials = JSON.parse(wo.materials || '[]');
    const isReserved = Boolean(wo.vendorApproved) || parsedMaterials.some((m: any) => (Number(m.reserved) || 0) > 0);

    return NextResponse.json({
      success: true,
      data: {
        isReserved,
        workOrder: {
          noWo: wo.noWo,
          namaPelanggan: wo.namaPelanggan,
          vendor: wo.vendor,
          pengawas: wo.pengawas,
          pengawas2: wo.pengawas2,
          status: wo.status,
          ketKendala: wo.ketKendala,
          idpel: wo.idpel,
          kontrakJasa: wo.kontrakJasa,
          nilaiJasa: wo.nilaiJasa,
          vendorTiang: wo.vendorTiang,
          materials: parsedMaterials,
          jasaProgress: JSON.parse(wo.jasaProgress || '{}'),
          jasaWeights: JSON.parse(wo.jasaWeights || '{}'),
          tiangRows: JSON.parse(wo.tiangRows || '[]'),
          bast: JSON.parse(wo.bast || '{}'),
          vendorToken: wo.vendorToken,
          vendorApproved: Boolean(wo.vendorApproved),
          vendorCatatan: wo.vendorCatatan,
          tglPemeriksaanPengawas: wo.tglPemeriksaanPengawas
        },
        daftung: daftung ? {
          idpel: daftung.idpel,
          nama: daftung.nama,
          alamat: daftung.alamat,
          tarif: daftung.tarif,
          daya: daftung.daya,
          jenisTransaksi: daftung.jenisTransaksi,
          durasiHariKerja: daftung.durasiHariKerja,
          nidi: daftung.nidi,
          slo: daftung.slo
        } : null,
        pickups: pickups.map(p => ({
          id: p.id,
          date: p.date,
          woNo: p.woNo,
          material: p.material,
          qty: p.qty,
          sj: p.sj,
          verified: p.verified,
          proofName: p.proofName
        }))
      }
    });
  } catch (error: any) {
    console.warn('Vendor API GET fallback triggered:', error?.message);
    const mockWO = mockStore.findWOByTokenOrNo(token);
    if (!mockWO) {
      return NextResponse.json({ success: false, error: 'Link Perintah Kerja (WO) tidak valid atau sudah kedaluwarsa.' }, { status: 404 });
    }
    const daftung = mockStore.daftung.find(d => d.id === mockWO.daftungId) || null;
    const pickups = mockStore.pickupHistory.filter(p => p.woNo === mockWO.noWo);
    const isReserved = Boolean(mockWO.vendorApproved) || (mockWO.materials || []).some(m => (Number(m.reserved) || 0) > 0);
    return NextResponse.json({
      success: true,
      data: {
        isReserved,
        workOrder: mockWO,
        daftung,
        pickups
      },
      isFallback: true
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const token = decodeURIComponent(params.token);
  let body: any = {};
  try {
    body = await request.json();
  } catch (_) {}
  const { action, payload } = body;

  try {
    const wo = await prisma.workOrder.findFirst({
      where: {
        OR: [
          { vendorToken: token },
          { noWo: token }
        ]
      }
    });

    if (!wo) {
      throw new Error('Perintah Kerja tidak ditemukan di database');
    }

    switch (action) {
      case 'UPDATE_VENDOR_PROGRESS': {
        const { jasaProgress, tiangRows, vendorCatatan } = payload;
        const updateData: any = {};
        if (jasaProgress) updateData.jasaProgress = JSON.stringify(jasaProgress);
        if (tiangRows) updateData.tiangRows = JSON.stringify(tiangRows);
        if (vendorCatatan !== undefined) updateData.vendorCatatan = vendorCatatan;

        const updated = await prisma.workOrder.update({
          where: { noWo: wo.noWo },
          data: updateData
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case 'SUBMIT_VENDOR_PICKUP': {
        const { material, qty, sj, proofName } = payload;
        const record = await prisma.vendorPickupHistory.create({
          data: {
            date: new Date().toISOString().split('T')[0],
            woNo: wo.noWo,
            vendor: wo.vendor,
            material,
            qty: String(qty),
            sj,
            verified: false,
            proofName: proofName || 'Bukti_SJ_Vendor.jpg'
          }
        });

        const currentMaterials = JSON.parse(wo.materials || '[]');
        const updatedMaterials = currentMaterials.map((m: any) => {
          if (m.code === material || m.name === material) {
            return {
              ...m,
              verified: (Number(m.verified) || 0) + Number(qty)
            };
          }
          return m;
        });

        await prisma.workOrder.update({
          where: { noWo: wo.noWo },
          data: { materials: JSON.stringify(updatedMaterials) }
        });

        return NextResponse.json({ success: true, data: record });
      }

      case 'SUBMIT_KENDALA': {
        const { catatan } = payload;
        const updated = await prisma.workOrder.update({
          where: { noWo: wo.noWo },
          data: {
            ketKendala: `[Vendor Lapangan]: ${catatan}`,
            vendorCatatan: catatan
          }
        });
        return NextResponse.json({ success: true, data: updated });
      }

      default:
        return NextResponse.json({ success: false, error: 'Aksi tidak dikenali.' }, { status: 400 });
    }
  } catch (error: any) {
    console.warn('Vendor API post DB failed, using mockStore fallback:', error?.message);
    const mockWO = mockStore.findWOByTokenOrNo(token);
    if (!mockWO) {
      return NextResponse.json({ success: false, error: 'Perintah Kerja tidak ditemukan.' }, { status: 404 });
    }

    switch (action) {
      case 'UPDATE_VENDOR_PROGRESS': {
        const { jasaProgress, tiangRows, vendorCatatan } = payload;
        if (jasaProgress) mockWO.jasaProgress = jasaProgress;
        if (tiangRows) mockWO.tiangRows = tiangRows;
        if (vendorCatatan !== undefined) mockWO.vendorCatatan = vendorCatatan;
        return NextResponse.json({ success: true, data: mockWO, isFallback: true });
      }

      case 'SUBMIT_VENDOR_PICKUP': {
        const { material, qty, sj, proofName } = payload;
        const newPickup = {
          id: `pk-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          woNo: mockWO.noWo,
          vendor: mockWO.vendor,
          material,
          qty: String(qty),
          sj,
          verified: false,
          proofName: proofName || 'Bukti_SJ_Vendor.jpg'
        };
        mockStore.pickupHistory.unshift(newPickup);
        if (mockWO.materials) {
          mockWO.materials = mockWO.materials.map(m => {
            if (m.code === material || m.name === material) {
              return { ...m, verified: (Number(m.verified) || 0) + Number(qty) };
            }
            return m;
          });
        }
        return NextResponse.json({ success: true, data: newPickup, isFallback: true });
      }

      case 'SUBMIT_KENDALA': {
        const { catatan } = payload;
        mockWO.ketKendala = `[Vendor Lapangan]: ${catatan}`;
        mockWO.vendorCatatan = catatan;
        return NextResponse.json({ success: true, data: mockWO, isFallback: true });
      }

      default:
        return NextResponse.json({ success: true, data: mockWO, isFallback: true });
    }
  }
}
