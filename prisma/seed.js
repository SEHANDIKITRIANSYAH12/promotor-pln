const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LATEST_STD_HEADERS = ["SERANDANG CANTOL","SERANDANG PORTAL","LVSB CANTOL","LVSB PORTAL","NYY 1X95","NYY 1X240","CABLE SHOE CU 95","CABLE SHOE CU 240","CABLE SHOE AL CU 150","LA","CUT OUT","FUSE LINK 2A","FUSE LINK 4A","FUSE LINK 8A","FUSE LINK 12A","TRAVES TUMPU","TRAVES GANDA","TRAVES AFSPAN","UNP GALVANIS","PIN ISOLATOR","HANG ISOLATOR","TOP TIES","DOUBLE TIES","STAYSET TM","GROUND ROD","CABLE SHOE CU 50","CCO 150","COVER BUSHING TRAFO","COVER BUSHING ISOLATOR","A3CS","A3CS GARDU"];

const LATEST_STD_DATA = [
  {"name":"1B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":1,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":1,"PIN ISOLATOR":3,"HANG ISOLATOR":0,"TOP TIES":3,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":3,"A3CS":0,"A3CS GARDU":0}},
  {"name":"2B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":1,"TRAVES AFSPAN":0,"UNP GALVANIS":2,"PIN ISOLATOR":6,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":3,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":6,"A3CS":0,"A3CS GARDU":0}},
  {"name":"3B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"4B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":1,"HANG ISOLATOR":6,"TOP TIES":1,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":1,"A3CS":0,"A3CS GARDU":0}},
  {"name":"5B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":1,"HANG ISOLATOR":6,"TOP TIES":1,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":1,"A3CS":0,"A3CS GARDU":0}},
  {"name":"6B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":0,"HANG ISOLATOR":6,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"7B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":1,"HANG ISOLATOR":6,"TOP TIES":1,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":1,"A3CS":0,"A3CS GARDU":0}},
  {"name":"8B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":1,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":3,"PIN ISOLATOR":4,"HANG ISOLATOR":3,"TOP TIES":4,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":4,"A3CS":0,"A3CS GARDU":0}},
  {"name":"9B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"10B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":1,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":3,"PIN ISOLATOR":5,"HANG ISOLATOR":6,"TOP TIES":5,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":5,"A3CS":0,"A3CS GARDU":0}},
  {"name":"11B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":3,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":0,"HANG ISOLATOR":3,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":1,"GROUND ROD":1,"CABLE SHOE CU 50":2,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"12B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"13B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"14B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"GARDU CANTOL","active":true,"materials":{"SERANDANG CANTOL":1,"SERANDANG PORTAL":0,"LVSB CANTOL":1,"LVSB PORTAL":0,"NYY 1X95":44,"NYY 1X240":0,"CABLE SHOE CU 95":8,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":12,"LA":3,"CUT OUT":3,"FUSE LINK 2A":0,"FUSE LINK 4A":3,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":4,"CABLE SHOE CU 50":8,"CCO 150":9,"COVER BUSHING TRAFO":3,"COVER BUSHING ISOLATOR":3,"A3CS":15,"A3CS GARDU":0}},
  {"name":"GARDU PORTAL","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":1,"LVSB CANTOL":0,"LVSB PORTAL":1,"NYY 1X95":0,"NYY 1X240":44,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":8,"CABLE SHOE AL CU 150":12,"LA":3,"CUT OUT":3,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":3,"FUSE LINK 12A":0,"TRAVES TUMPU":2,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":4,"PIN ISOLATOR":6,"HANG ISOLATOR":3,"TOP TIES":6,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":4,"CABLE SHOE CU 50":8,"CCO 150":9,"COVER BUSHING TRAFO":3,"COVER BUSHING ISOLATOR":6,"A3CS":20,"A3CS GARDU":0}},
  {"name":"GARDU PORTAL RMU","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":1,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"GARDU BETON","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"STAYSET","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":1,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"CO AFTAK","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":3,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":3,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}}
];

const GUDANG_DATA = [
  {material:"3250046",description:"MCB;230/400V;1P;2A;50Hz;",sap:550,fisik:550,unit:"pcs"},
  {material:"3250048",description:"MCB;230/400V;1P;4A;50Hz;",sap:3507,fisik:3507,unit:"pcs"},
  {material:"3250050",description:"MCB;230/400V;1P;6A;50Hz;",sap:2873,fisik:2873,unit:"pcs"},
  {material:"3250052",description:"MCB;230/400V;1P;10A;50Hz;",sap:921,fisik:921,unit:"pcs"},
  {material:"3250056",description:"MCB;230/400V;1P;20A;50Hz;",sap:181,fisik:181,unit:"pcs"},
  {material:"3250097",description:"MCB;230/400V;3P;10A;50Hz;",sap:123,fisik:123,unit:"pcs"},
  {material:"3250099",description:"MCB;230/400V;3P;16A;50Hz;",sap:29,fisik:29,unit:"pcs"},
  {material:"3250102",description:"MCB;230/400V;3P;25A;50Hz;",sap:66,fisik:66,unit:"pcs"},
  {material:"3250103",description:"MCB;230/400V;3P;35A;50Hz;",sap:4,fisik:4,unit:"pcs"},
  {material:"3250031",description:"MCB;380/440V;3P;63A;50Hz;",sap:77,fisik:77,unit:"pcs"},
  {material:"3250296",description:"MCB;230/415V;3P;200A;50Hz;MCCB+SHUNTTRIP",sap:7,fisik:7,unit:"pcs"},
  {material:"3250297",description:"MCB;230/415V;3P;225A;50Hz;MCCB+SHUNTTRIP",sap:6,fisik:6,unit:"pcs"},
  {material:"3250300",description:"MCB;230/415V;3P;80A;50Hz;MCCB+SHUNTTRIP",sap:1,fisik:1,unit:"pcs"},
  {material:"3250301",description:"MCB;230/415V;3P;100A;50Hz;MCCB+SHUNTTRIP",sap:5,fisik:5,unit:"pcs"},
  {material:"3250302",description:"MCB;230/415V;3P;125A;50Hz;MCCB+SHUNTTRIP",sap:6,fisik:6,unit:"pcs"},
  {material:"3250303",description:"MCB;230/415V;3P;160A;50Hz;MCCB+SHUNTTRIP",sap:7,fisik:7,unit:"pcs"},
  {material:"2190224",description:"MTR;kWH E-PR;;1P;230V;5-60A;1;;2W",sap:510,fisik:510,unit:"pcs"},
  {material:"2190252",description:"MTR;kWH E-PR;;3P;230/400V;5-80A;1;;4W",sap:195,fisik:195,unit:"pcs"},
  {material:"2190267",description:"MTR;kWH E;;1P;220/240V;5-100A;1;ST;2W",sap:56,fisik:56,unit:"pcs"},
  {material:"2190218",description:"MTR;kWH E;;3P;230/400V;5-80A;1;;4W",sap:47,fisik:47,unit:"pcs"},
  {material:"2190438",description:"MTR;kWHE;;3P;57.7/100V-230/400;5A;0.5;4W",sap:281,fisik:281,unit:"pcs"},
  {material:"3110025",description:"CABLE PWR;NFA2X;2X10mm2;0.6/1kV;OH",sap:66,fisik:66,unit:"meter"},
  {material:"3110517",description:"CABLE PWR;NYY;1X240mm2;0.6/1kV;Opstig",sap:440,fisik:440,unit:"meter"},
  {material:"3110515",description:"CABLE PWR;NYY;1X95mm2;0.6/1kV;Opstig",sap:956,fisik:956,unit:"meter"},
  {material:"3110514",description:"CABLE PWR;NYY;1X70mm2;0.6/1kV;Opstig",sap:13,fisik:13,unit:"meter"},
  {material:"3110542",description:"CABLE PWR;NFA2X-T;3X70+1X70;0.6/1kV;OH",sap:1393,fisik:1393,unit:"meter"},
  {material:"3050084",description:"CONDUCTOR;AAAC-S;150mm2;",sap:78,fisik:78,unit:"meter"},
  {material:"3110015",description:"CABLE PWR;NA2XSEYBY;3X240mm2;20kV;UG",sap:1275,fisik:1275,unit:"meter"},
  {material:"3110034",description:"CABLE PWR;NFA2XSY-T;3X150+1X95;20kV;OH",sap:4024,fisik:4024,unit:"meter"},
  {material:"1030075",description:"TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD",sap:6,fisik:6,unit:"unit"},
  {material:"3260238",description:"LVSB;DIST;3P;400V;400A;4LINE;OD",sap:5,fisik:5,unit:"unit"},
  {material:"3260226",description:"LVSB;DIST;3P;400V;630A;4LINE;OD",sap:1,fisik:1,unit:"unit"},
  {material:"2150150",description:"CUB;N ISO;CBOG;24kV;630A;16kA;",sap:5,fisik:5,unit:"unit"},
  {material:"2150188",description:"CUB;N ISO;LBS;24kV;630A;16kA;",sap:5,fisik:5,unit:"unit"},
  {material:"2150173",description:"CUB;N ISO;LBS MOTORIZE;24KV;630A;16KA",sap:4,fisik:4,unit:"unit"},
  {material:"2050128",description:"CT;380/220V;SQUARE;100/5A;0.5;5VA;P",sap:6,fisik:6,unit:"pcs"},
  {material:"2050927",description:"CT;20kV;K;10/5-5A;0.2S;15-10VA;ID",sap:6,fisik:6,unit:"pcs"},
  {material:"2050929",description:"CT;20kV;K;20/5-5A;0.2S;15-10VA;ID",sap:10,fisik:10,unit:"pcs"},
  {material:"4120467",description:"BOX;APPMCCB80A+STRIP;AL2MM;1205X420X250",sap:24,fisik:24,unit:"unit"},
  {material:"4120470",description:"BOX;APPMCCB160A+STRIP;AL2MM;1205X420X250",sap:17,fisik:17,unit:"unit"},
  {material:"4120471",description:"BOX;APPMCCB200A+STRIP;AL2MM;1205X420X250",sap:14,fisik:14,unit:"unit"},
  {material:"3190012",description:"CUT OUT;24kV;6-100A;8kA;125kV",sap:52,fisik:52,unit:"pcs"},
  {material:"3200010",description:"CUT OUT ACC;FUSE LINK 20kV 3A",sap:105,fisik:105,unit:"pcs"},
  {material:"3200018",description:"CUT OUT ACC;FUSE LINK 20kV 5A",sap:107,fisik:107,unit:"pcs"},
  {material:"3200015",description:"CUT OUT ACC;FUSE LINK 20kV 6A",sap:120,fisik:120,unit:"pcs"},
  {material:"3280185",description:"CONN;20kV;H;AL;150-150mm2;PRS;",sap:1949,fisik:1949,unit:"pcs"},
  {material:"3280293",description:"CONN;1kV;CCO;AL;35-70/70-150mm2;PRS;",sap:1917,fisik:1917,unit:"pcs"},
  {material:"3280459",description:"CONN;1KV;CCO;AL;50-70/50-70;INSUL;PITA",sap:2706,fisik:2706,unit:"pcs"},
  {material:"3120114",description:"CABLE PWR ACC;CABLE SHOE CU 70mm2",sap:1055,fisik:1055,unit:"pcs"},
  {material:"3120121",description:"CABLE PWR ACC;CABLE SHOE CU 240mm2",sap:376,fisik:376,unit:"pcs"},
  {material:"3120122",description:"CABLE PWR ACC;CABLE SHOE AL 70mm2",sap:500,fisik:500,unit:"pcs"},
  {material:"3120018",description:"CABLE PWR ACC;CABLE SHOE CU 95mm2",sap:838,fisik:838,unit:"pcs"},
  {material:"3040035",description:"POLE ACC;CR ARM UNP100X50X6X2000mm GALV",sap:50,fisik:50,unit:"pcs"},
  {material:"3040246",description:"POLE ACC;CR ARM UNP100X50X5X2500mm GALV",sap:47,fisik:47,unit:"pcs"},
  {material:"3041017",description:"UNIV ACC;TRAVES TUMPU",sap:35,fisik:35,unit:"pcs"},
  {material:"3041019",description:"UNIV ACC;TRAVES TUMPU DOUBLE",sap:52,fisik:52,unit:"pcs"},
  {material:"3041063",description:"UNIV ACC; TRAVERS AFSPAN PORTAL",sap:50,fisik:50,unit:"pcs"},
  {material:"1060069",description:"TRF ACC;SERANDANG TRAFO 3P;2 TIANG",sap:26,fisik:26,unit:"pcs"},
  {material:"3040329",description:"POLE ACC;STAY SET TM",sap:79,fisik:79,unit:"pcs"},
  {material:"3040330",description:"POLE ACC;STAY SET TR",sap:238,fisik:238,unit:"pcs"},
  {material:"2090032",description:"LA;20-24kV;K;10kA;POLYMER;;",sap:12,fisik:12,unit:"pcs"},
  {material:"4190454",description:"UNIV ACC;GROUND ROD CU 5/8\"X2500mm",sap:1519,fisik:1519,unit:"pcs"},
  {material:"3120033",description:"CABLE PWR ACC;DEAD END ASSY ADJ 70mm",sap:563,fisik:563,unit:"pcs"},
  {material:"3120038",description:"CABLE PWR ACC;DEAD END ASSY FIXED 70mm",sap:549,fisik:549,unit:"pcs"},
  {material:"3120092",description:"CABLE PWR ACC;SUSPENSION ASSY 70mm",sap:1602,fisik:1602,unit:"pcs"},
  {material:"3120142",description:"CABLE PWR ACC;WEDGE CLAMP 2x(6-16)mm",sap:8800,fisik:8800,unit:"pcs"}
];

const KONTRAK_JASA_DATA = [
  {no:'SPK-JASA-001/2026',pt:'PT. TRI STARS NUSANTARA',desc:'Pekerjaan Konstruksi Jaringan Distribusi Banten Selatan',awal:'2026-01-15',akhir:'2026-12-31',nilai:1000000000},
  {no:'SPK-JASA-002/2026',pt:'PT. Fakhri Putra Utama',desc:'Pembangunan dan Pemeliharaan Gardu Distribusi',awal:'2026-03-01',akhir:'2026-10-31',nilai:750000000},
  {no:'SPK-JASA-003/2026',pt:'PT. Datu Nahima Teknik',desc:'Pekerjaan Konstruksi ULP Rangkasbitung',awal:'2026-02-01',akhir:'2026-09-30',nilai:500000000}
];

const KONTRAK_MATERIAL_DATA = [
  {
    no:'SPK-MAT-001/2026',pt:'PT. PLN Material Nusantara',desc:'Pengadaan Material Gardu dan Jaringan',awal:'2026-01-10',akhir:'2026-12-31',nilai:2500000000,
    materials: JSON.stringify([
      {code:'1030075',name:'TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD',qty:3,unit:'unit',checked:false},
      {code:'3110515',name:'CABLE PWR;NYY;1X95mm2;0.6/1kV;Opstig',qty:250,unit:'meter',checked:false},
      {code:'3040035',name:'POLE ACC;CR ARM UNP100X50X6X2000mm GALV',qty:8,unit:'pcs',checked:true}
    ])
  },
  {
    no:'SPK-MAT-002/2026',pt:'PT. Energi Material Indonesia',desc:'Pengadaan Kabel dan Perlengkapan Distribusi',awal:'2026-02-15',akhir:'2026-11-30',nilai:1500000000,
    materials: JSON.stringify([
      {code:'3110517',name:'CABLE PWR;NYY;1X240mm2;0.6/1kV;Opstig',qty:180,unit:'meter',checked:false},
      {code:'3260238',name:'LVSB;DIST;3P;400V;400A;4LINE;OD',qty:4,unit:'unit',checked:true}
    ])
  },
  {
    no:'SPK-MAT-003/2026',pt:'PT. Banten Distribusi Supply',desc:'Pengadaan Trafo dan Material Pendukung',awal:'2026-04-01',akhir:'2026-10-31',nilai:1000000000,
    materials: JSON.stringify([
      {code:'2090032',name:'LA;20-24kV;K;10kA;POLYMER;;',qty:6,unit:'pcs',checked:false}
    ])
  }
];

const DAFTUNG_RAW = [
  {"idpel":"562300789984","nama":"HJ ATI MUFLIHAT","alamat":"KP MARGAMULYA RT005/RW002 SUKAMANAH, MALINGPING, KAB. LEBAK, BANTEN","tarif":"I2","daya":23000,"jenisTransaksi":"PASANG BARU","noWo":"295.07.WO.2026","penyediaJasa":"PT Fakhri Putra Utama","pengawas":"Winnetou Chandra","tglBayar":"2026-07-02","durasiHariKerja":57,"kriteriaTmp":"Lebih dari 24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP MALINGPING"},
  {"idpel":"562101101806","nama":"PT MUNS CIPTA BANGUN","alamat":"JL RAYA KADUANGUNG - CILELES CIGOONG SELATAN, CIKULUR, KAB. LEBAK, BANTEN","tarifLama":"B1T","dayaLama":5500,"tarif":"I3","daya":345000,"jenisTransaksi":"PERUBAHAN DAYA","noWo":"311.07.WO.2026","penyediaJasa":"PT Cipta Sedayu Elektrindo","pengawas":"Faisal Reza","tglBayar":"2026-07-10","durasiHariKerja":51,"kriteriaTmp":"60 Hari","statusPermohonan":"CETAK PK","namaup":"ULP RANGKASBITUNG"},
  {"idpel":"562101594784","nama":"HIDIR HIDAYAT","alamat":"KP PASIR GINTUNG ANGGALAN, CIKULUR, KAB. LEBAK, BANTEN","tarif":"I2","daya":66000,"jenisTransaksi":"PASANG BARU","noWo":"316.07.WO.2026","penyediaJasa":"PT Datu Nahima Teknik","pengawas":"Hasian Sitorus","tglBayar":"2026-07-13","durasiHariKerja":50,"kriteriaTmp":"Lebih dari 24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP RANGKASBITUNG"},
  {"idpel":"562300793039","nama":"KDMP KADUMELATI SDNGRESMI","alamat":"KP SINAR GUNUNG SINDANGRESMI, KAB. PANDEGLANG, BANTEN","tarif":"B2T","daya":16500,"jenisTransaksi":"PASANG BARU","noWo":"362.08.WO.2026","penyediaJasa":"PT Lynard Power Kontraktor","pengawas":"Yadi Triyadi","tglBayar":"2026-07-18","durasiHariKerja":46,"kriteriaTmp":"Lebih dari 24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP MALINGPING"},
  {"idpel":"562101597296","nama":"PT SINAR TERNAK SEJAHTERA","alamat":"DS MEKARAHAYU, BOJONGMANIK, KAB. LEBAK, BANTEN","tarif":"I3","daya":240000,"jenisTransaksi":"PASANG BARU","noWo":"352.07.WO.2026","penyediaJasa":"PT Tri Stars Nusantara","pengawas":"Faisal Reza","tglBayar":"2026-07-22","durasiHariKerja":43,"kriteriaTmp":"75 Hari","statusPermohonan":"CETAK PK","namaup":"ULP RANGKASBITUNG"},
  {"idpel":"562300795728","nama":"ALVIN JONATHAN KUSUMA","alamat":"JL RAYA MALINGPING PS. KUPA, MALINGPING, KAB. LEBAK, BANTEN","tarif":"B2","daya":82500,"jenisTransaksi":"PASANG BARU","noWo":"381.08.WO.2026","penyediaJasa":"PT Eyssa Jantra Mandiri","pengawas":"Rizki Wahyu","tglBayar":"2026-08-03","durasiHariKerja":35,"kriteriaTmp":"Lebih dari 24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP MALINGPING"},
  {"idpel":"562300798271","nama":"PT MAKMUR KAYU PERSADA","alamat":"KP SUKASARI SUKAJADI, PANGGARANGAN, KAB. LEBAK, BANTEN","tarif":"I2","daya":197000,"jenisTransaksi":"PASANG BARU","noWo":"383.08.WO.2026","penyediaJasa":"PT Eyssa Jantra Mandiri","pengawas":"Rizki Wahyu","tglBayar":"2026-08-14","durasiHariKerja":26,"kriteriaTmp":"Lebih dari 24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP MALINGPING"},
  {"idpel":"562400797834","nama":"KDMP KIARAJANGKUNG","alamat":"KP KIARA JANGKUNG, CIBITUNG, KAB. PANDEGLANG, BANTEN","tarif":"B2T","daya":16500,"jenisTransaksi":"PASANG BARU","noWo":"422.09.WO.2026","penyediaJasa":"PT Lynard Power Kontraktor","pengawas":"Yadi Triyadi","tglBayar":"2026-08-20","durasiHariKerja":23,"kriteriaTmp":"24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP LABUAN"},
  {"idpel":"562300798837","nama":"MUHAMMAD ZIDANE","alamat":"KP MANGGU TAMANSARI, BANJARSARI, KAB. LEBAK, BANTEN","tarif":"I2","daya":53000,"jenisTransaksi":"PASANG BARU","noWo":"391.08.WO.2026","penyediaJasa":"PT Fakhri Putra Utama","pengawas":"Winnetou Chandra","tglBayar":"2026-08-24","durasiHariKerja":21,"kriteriaTmp":"24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP MALINGPING"},
  {"idpel":"562400798781","nama":"KDMP PEJAMBEN","alamat":"JL RAYA CARITA, PEJAMBEN, CARITA, KAB. PANDEGLANG, BANTEN","tarif":"B2T","daya":16500,"jenisTransaksi":"PASANG BARU","noWo":"421.09.WO.2026","penyediaJasa":"PT Lynard Power Kontraktor","pengawas":"Yadi Triyadi","tglBayar":"2026-08-27","durasiHariKerja":19,"kriteriaTmp":"24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP LABUAN"},
  {"idpel":"562400798799","nama":"KDMP BANJARMASIN","alamat":"JL RAYA CARITA BANJARMASIN, CARITA, KAB. PANDEGLANG, BANTEN","tarif":"B2T","daya":16500,"jenisTransaksi":"PASANG BARU","noWo":"","penyediaJasa":"","pengawas":"","tglBayar":"2026-08-28","durasiHariKerja":18,"kriteriaTmp":"24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP LABUAN"},
  {"idpel":"562101607754","nama":"PT PRIMA NIAGA LANCAR","alamat":"KP TALUN MASJID CIBADAK, KAB. LEBAK, BANTEN","tarif":"I1","daya":13200,"jenisTransaksi":"PASANG BARU","noWo":"","penyediaJasa":"","pengawas":"","tglBayar":"2026-09-01","durasiHariKerja":16,"kriteriaTmp":"24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP RANGKASBITUNG"}
];

const VENDOR_TIANG_LIST = [
  'PT Tiang Nusantara',
  'CV Pilar Tiang Jaya',
  'PT Beton Distribusi Mandiri'
];

async function main() {
  console.log('Seeding PROMOTOR V1.0 Database...');

  // 1. Standar Konstruksi
  for (const item of LATEST_STD_DATA) {
    await prisma.standardKonstruksi.upsert({
      where: { name: item.name },
      update: {
        active: item.active,
        materials: JSON.stringify(item.materials)
      },
      create: {
        name: item.name,
        active: item.active,
        materials: JSON.stringify(item.materials)
      }
    });
  }
  console.log('✓ Standard Konstruksi seeded');

  // 2. Gudang Material
  for (const m of GUDANG_DATA) {
    await prisma.gudangMaterial.upsert({
      where: { material: m.material },
      update: {
        description: m.description,
        sap: m.sap,
        fisik: m.fisik,
        unit: m.unit
      },
      create: {
        material: m.material,
        description: m.description,
        sap: m.sap,
        fisik: m.fisik,
        unit: m.unit
      }
    });
  }
  console.log('✓ Gudang Material seeded');

  // 3. Kontrak Jasa
  for (const kj of KONTRAK_JASA_DATA) {
    await prisma.kontrakJasa.upsert({
      where: { no: kj.no },
      update: kj,
      create: kj
    });
  }
  console.log('✓ Kontrak Jasa seeded');

  // 4. Kontrak Material
  for (const km of KONTRAK_MATERIAL_DATA) {
    await prisma.kontrakMaterial.upsert({
      where: { no: km.no },
      update: km,
      create: km
    });
  }
  console.log('✓ Kontrak Material seeded');

  // 5. Vendor Tiang Master
  for (const name of VENDOR_TIANG_LIST) {
    await prisma.vendorTiangMaster.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log('✓ Vendor Tiang seeded');

  // 6. Daftung & Survey & Work Orders
  for (let i = 0; i < DAFTUNG_RAW.length; i++) {
    const raw = DAFTUNG_RAW[i];
    const srvId = `SRV-${String(i + 1).padStart(4, '0')}`;
    const dtId = `DT-${String(i + 1).padStart(4, '0')}`;

    const surveyMaterials = [
      { code: '1030075', name: 'TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD', unit: 'unit', qty: 1, note: '' },
      { code: '3110515', name: 'CABLE PWR;NYY;1X95mm2;0.6/1kV;Opstig', unit: 'meter', qty: 44, note: '' },
      { code: '3120114', name: 'CABLE PWR ACC;CABLE SHOE CU 70mm2', unit: 'pcs', qty: 8, note: '' },
      { code: 'TIANG-12M', name: 'Tiang Beton 12M 350daN', unit: 'batang', qty: 2, note: '' }
    ];

    await prisma.survey.upsert({
      where: { id: srvId },
      update: {},
      create: {
        id: srvId,
        status: i < 8 ? 'Selesai' : 'Draft',
        surveyor: ['Surveyor 01', 'Surveyor 02', 'Surveyor 03'][i % 3],
        created: raw.tglBayar || '2026-09-20',
        updated: raw.tglBayar || '2026-09-20',
        customer: JSON.stringify({
          idpel: raw.idpel,
          name: raw.nama,
          address: raw.alamat,
          daya: raw.daya,
          tarif: raw.tarif,
          jenis: raw.jenisTransaksi
        }),
        technical: JSON.stringify({
          pelangganKhusus: '',
          ulp: raw.namaup,
          tipeGardu: i % 2 === 0 ? 'Portal' : 'Cantol',
          kapasitasTrafo: 160,
          jumlahKabelNaik: 4,
          penyulang: 'KADUAGUNG'
        }),
        location: JSON.stringify({
          address: raw.alamat,
          lat: '-6.52414600',
          lng: '106.17685700',
          photos: [`Foto_Lokasi_${raw.nama.replace(/\s+/g, '_')}.jpg`]
        }),
        standardSelections: JSON.stringify([{ name: i % 2 === 0 ? 'GARDU PORTAL' : 'GARDU CANTOL', qty: 1, note: 'Standar utama' }]),
        materials: JSON.stringify(surveyMaterials),
        daftungId: dtId,
        sourceLegacy: false
      }
    });

    await prisma.daftung.upsert({
      where: { id: dtId },
      update: {},
      create: {
        id: dtId,
        idpel: raw.idpel,
        nama: raw.nama,
        alamat: raw.alamat,
        tarifLama: raw.tarifLama || '',
        dayaLama: raw.dayaLama || 0,
        tarif: raw.tarif,
        daya: raw.daya,
        jenisTransaksi: raw.jenisTransaksi,
        noWo: raw.noWo || '',
        penyediaJasa: raw.penyediaJasa || '',
        pengawas: raw.pengawas || '',
        tglBayar: raw.tglBayar,
        durasiHariKerja: raw.durasiHariKerja,
        kriteriaTmp: raw.kriteriaTmp,
        statusPermohonan: raw.statusPermohonan,
        namaup: raw.namaup,
        surveyId: srvId,
        sumber: 'SURVEY',
        statusDaftung: raw.noWo ? 'WO Proses' : 'Siap WO',
        nidi: i === 0,
        slo: i === 0
      }
    });

    if (raw.noWo) {
      const isInitialDone = i === 0;
      const woMaterials = [
        { code: '1030075', name: 'TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD', unit: 'unit', required: 1, reserved: isInitialDone ? 1 : 0, verified: isInitialDone ? 1 : 0, condition: 'Baik' },
        { code: '3110515', name: 'CABLE PWR;NYY;1X95mm2;0.6/1kV;Opstig', unit: 'meter', required: 44, reserved: isInitialDone ? 44 : 0, verified: isInitialDone ? 44 : 0, condition: 'Baik' },
        { code: '3120114', name: 'CABLE PWR ACC;CABLE SHOE CU 70mm2', unit: 'pcs', required: 8, reserved: isInitialDone ? 8 : 0, verified: isInitialDone ? 8 : 0, condition: 'Baik' }
      ];

      const tiangRows = [
        { code: 'TIANG-12M', name: 'Tiang Beton 12M 350daN', unit: 'batang', qtySurvey: 2, qtyWO: 2, vendor: 'PT Tiang Nusantara', installedQty: isInitialDone ? 2 : 0, verifiedQty: isInitialDone ? 2 : 0, verified: isInitialDone, progress: isInitialDone ? 100 : 0 }
      ];

      await prisma.workOrder.upsert({
        where: { noWo: raw.noWo },
        update: {
          vendorApproved: isInitialDone,
          vendorToken: isInitialDone ? `VND-${raw.noWo.replace(/[^a-zA-Z0-9]/g, '')}-DEMO` : '',
          materials: JSON.stringify(woMaterials)
        },
        create: {
          noWo: raw.noWo,
          namaPelanggan: raw.nama,
          vendor: raw.penyediaJasa || 'PT. TRI STARS NUSANTARA',
          pengawas: raw.pengawas || 'Faisal Reza',
          pengawas2: 'Daud Febriansyah',
          status: isInitialDone ? 'Selesai' : 'Aktif',
          ketKendala: i === 2 ? 'Menunggu penanaman tiang dari vendor' : '',
          daftungId: dtId,
          surveyId: srvId,
          idpel: raw.idpel,
          kontrakJasa: KONTRAK_JASA_DATA[i % 3].no,
          nilaiJasa: 75000000,
          vendorTiang: 'PT Tiang Nusantara',
          vendorApproved: isInitialDone,
          vendorToken: isInitialDone ? `VND-${raw.noWo.replace(/[^a-zA-Z0-9]/g, '')}-DEMO` : '',
          materials: JSON.stringify(woMaterials),
          jasaProgress: JSON.stringify({
            tiang: isInitialDone,
            konstruksi: false,
            penarikan: false,
            kerangka: false,
            trafo_app: false
          }),
          jasaWeights: JSON.stringify({ tiang: 20, konstruksi: 20, penarikan: 20, kerangka: 20, trafo_app: 20 }),
          tiangRows: JSON.stringify(tiangRows),
          bast: JSON.stringify({
            conditions: { '1030075': 'Baik', '3110515': 'Baik' },
            asmanKonstruksi: 'Hendra Setiawan, S.T.',
            asmanJaringan: 'Budi Santoso, M.T.'
          })
        }
      });
    }
  }

  // 7. Seed Sample Vendor Pickup History
  await prisma.vendorPickupHistory.create({
    data: {
      date: '2026-09-25',
      woNo: '295.07.WO.2026',
      vendor: 'PT Fakhri Putra Utama',
      material: 'TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD',
      qty: '1 unit',
      sj: 'SJ-2026-0091',
      verified: true,
      proofName: 'Bukti_SJ_2026_0091.pdf'
    }
  });

  console.log('✓ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
