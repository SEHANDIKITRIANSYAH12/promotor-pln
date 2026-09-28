import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = decodeURIComponent(params.token);
    
    // Find WO by vendorToken or noWo
    let wo = await prisma.workOrder.findFirst({
      where: {
        OR: [
          { vendorToken: token },
          { noWo: token }
        ]
      }
    });

    if (!wo) {
      return NextResponse.json({ success: false, error: 'Link Perintah Kerja (WO) tidak valid atau sudah kedaluwarsa.' }, { status: 404 });
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
          vendorToken: wo.vendorToken,
          vendorApproved: wo.vendorApproved,
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
    console.error('Vendor API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = decodeURIComponent(params.token);
    const body = await request.json();
    const { action, payload } = body;

    const wo = await prisma.workOrder.findFirst({
      where: {
        OR: [
          { vendorToken: token },
          { noWo: token }
        ]
      }
    });

    if (!wo) {
      return NextResponse.json({ success: false, error: 'Perintah Kerja tidak ditemukan.' }, { status: 404 });
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

        // Also update the verified qty in WO material
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
    console.error('Vendor API post error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
