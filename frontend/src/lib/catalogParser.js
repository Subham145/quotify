/**
 * Comprehensive Catalog Parser for Kirloskar Industrial Vertical Multistage Pumps
 * Handles KVM Series, KCIL/KSIL Series (1 - 90 Series), ETERNA CW+, and Generic Tables.
 */
export function parseCatalogText(text, defaultCategory = 'DEWAS') {
  if (!text || typeof text !== 'string') return [];

  // Normalize all dashes and spaces
  const normalizedText = text
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/[ \t]+/g, ' ');

  const rawLines = normalizedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const products = [];
  const seenModels = new Set();

  let currentSeries = '';
  let currentCategory = defaultCategory || 'DEWAS';
  let currentGroup = 'Vertical Multistage Inline Pumps';
  let currentFlowNominal = '';

  // STRATEGY 1: Line-by-Line Row Parser
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Detect Series Headers
    if (/KVM\s+(\d+(?:\.\d+)?)\s*(?:m3\/hr|m³\/hr)?\s*SERIES/i.test(line)) {
      const match = line.match(/KVM\s+(\d+(?:\.\d+)?)\s*(?:m3\/hr|m³\/hr)?\s*SERIES/i);
      currentFlowNominal = match ? `${match[1]} m³/hr` : '';
      currentSeries = `KVM ${currentFlowNominal} Series`;
      currentGroup = 'KVM Multistage Inline Pumps';
      currentCategory = defaultCategory || 'DEWAS';
      continue;
    } else if (/(?:KCIL\s*[\/\\]\s*KSIL|KSIL\s*[\/\\]\s*KCIL|KCIL|KSIL)\s*PUMPSETS?\s*[-–]\s*(\d+)\s*SERIES/i.test(line)) {
      const match = line.match(/(?:KCIL\s*[\/\\]\s*KSIL|KSIL\s*[\/\\]\s*KCIL|KCIL|KSIL)\s*PUMPSETS?\s*[-–]\s*(\d+)\s*SERIES/i);
      const seriesNo = match ? match[1] : '';
      currentFlowNominal = seriesNo ? `${seriesNo} m³/hr nominal` : '';
      currentSeries = `KCIL/KSIL ${seriesNo} Series`;
      currentGroup = 'Vertical Multistage Inline Pumps';
      currentCategory = defaultCategory || 'DEWAS';
      continue;
    } else if (/ETERNA\s+CW\+/i.test(line)) {
      currentSeries = 'ETERNA CW+ Series';
      currentGroup = 'Submersible Sewage Pumps';
      currentCategory = defaultCategory || 'DEWAS';
      continue;
    } else if (/KOS[- ]?M\s*SERIES|KOSM\s*SERIES/i.test(line)) {
      currentSeries = 'KOS-M Series';
      currentGroup = 'Openwell Submersible Pumps';
      currentCategory = defaultCategory || 'DEWAS';
      continue;
    } else if (/KOS\s*SERIES/i.test(line)) {
      currentSeries = 'KOS Series';
      currentGroup = 'Openwell Submersible Pumps';
      currentCategory = defaultCategory || 'DEWAS';
      continue;
    }

    // 1. KVM Models Row (e.g. "1 KVM - 2070 1.1 1.5 25 25 10 77 75 70 66 53 46 38 29 20")
    const kvmMatch = line.match(
      /(?:^\d+\s+)?\b(KVM\s*[-–]?\s*\d{3,5})\b(?:\s+([\d\.,]+))?(?:\s+([\d\.,]+))?(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+([\d\.\s\-,\/]+))?/i
    );
    if (kvmMatch) {
      const rawModel = kvmMatch[1].replace(/\s+/g, ' ').trim();
      const modelName = rawModel.replace(/\s*-\s*/, '-');
      const modelKey = modelName.toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (!seenModels.has(modelKey)) {
        seenModels.add(modelKey);
        const kw = kvmMatch[2] ? kvmMatch[2].replace(',', '.') : '';
        const hp = kvmMatch[3] ? kvmMatch[3].replace(',', '.') : '';
        const suc = kvmMatch[4] || (modelName.includes('20') ? '25' : modelName.includes('40') ? '32' : modelName.includes('100') ? '42' : '65');
        const del = kvmMatch[5] || suc;
        const stages = kvmMatch[6] || '';
        const headValues = (kvmMatch[7] || '')
          .trim()
          .split(/[\s,]+/)
          .map((v) => Number(v.replace(',', '.')))
          .filter((n) => !isNaN(n) && n > 0);

        const minHead = headValues.length ? Math.min(...headValues) : '';
        const maxHead = headValues.length ? Math.max(...headValues) : '';
        const headStr =
          minHead && maxHead
            ? minHead === maxHead
              ? `${minHead} m`
              : `${minHead} - ${maxHead} m`
            : '';

        products.push({
          product_name: modelName,
          code: modelName,
          category: currentCategory,
          group_name: currentGroup || 'KVM Multistage Inline Pumps',
          hp: hp ? `${hp} HP` : '',
          kw: kw ? `${kw} kW` : '',
          head: headStr,
          flow_rate: currentFlowNominal || (modelName.includes('20') ? '2 m³/hr' : modelName.includes('40') ? '4 m³/hr' : modelName.includes('100') ? '10 m³/hr' : '15 m³/hr'),
          pipe_size: `${suc} x ${del} mm`,
          solid_size: '-',
          stages: stages,
          price: 0,
          gst_rate: 18,
          unit: 'piece',
        });
      }
      continue;
    }

    // 2. KSIL / KCIL Models Row (e.g. "1 KSIL/KCIL1-2 0.37 0.5 32 32 2 12 12 12...", "1 KCIL32-1-1 1.5 2.0 74 74 1 15 14...")
    const kcilMatch = line.match(
      /(?:^\d+\s+)?\b((?:KSIL\s*[\/\\]\s*KCIL|KCIL\s*[\/\\]\s*KSIL|KCIL|KSIL)\s*[\d]+(?:\s*[-–]\s*[\d]+(?:\s*[-–]\s*[\d]+)?)?)\b(?:\s+([\d\.,]+))?(?:\s+([\d\.,]+))?(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+([\d\.\s\-,\/]+))?/i
    );
    if (kcilMatch) {
      const rawModel = kcilMatch[1].replace(/\s+/g, '').trim();
      const modelName = rawModel;
      const modelKey = modelName.toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Avoid capturing pure header words like "KCIL" without model numbers
      if (!seenModels.has(modelKey) && /\d/.test(modelName)) {
        seenModels.add(modelKey);
        const kw = kcilMatch[2] ? kcilMatch[2].replace(',', '.') : '';
        const hp = kcilMatch[3] ? kcilMatch[3].replace(',', '.') : '';
        const suc = kcilMatch[4] || inferPipeSize(modelName);
        const del = kcilMatch[5] || suc;
        const stages = kcilMatch[6] || '';
        const headValues = (kcilMatch[7] || '')
          .trim()
          .split(/[\s,]+/)
          .map((v) => Number(v.replace(',', '.')))
          .filter((n) => !isNaN(n) && n > 0);

        const minHead = headValues.length ? Math.min(...headValues) : '';
        const maxHead = headValues.length ? Math.max(...headValues) : '';
        const headStr =
          minHead && maxHead
            ? minHead === maxHead
              ? `${minHead} m`
              : `${minHead} - ${maxHead} m`
            : '';

        products.push({
          product_name: modelName,
          code: modelName,
          category: currentCategory,
          group_name: currentGroup || 'Vertical Multistage Inline Pumps',
          hp: hp ? `${hp} HP` : '',
          kw: kw ? `${kw} kW` : '',
          head: headStr,
          flow_rate: currentFlowNominal || inferFlow(modelName),
          pipe_size: `${suc} x ${del} mm`,
          solid_size: '-',
          stages: stages,
          price: 0,
          gst_rate: 18,
          unit: 'piece',
        });
      }
      continue;
    }

    // 3. ETERNA CW+ Row (e.g. "1 ETERNA 370 CW+ 0.37 0.5 50 210V 2800 18 171 144 114 66 - - - - - 375")
    const eternaMatch = line.match(
      /(?:^\d+\s+)?\b(ETERNA\s+\d+\s*CW\+?)\b(?:\s+([\d\.,]+))?(?:\s+([\d\.,]+))?(?:\s+(\d+))?(?:\s+([\d\w]+))?(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+([\d\.\s\-,\/]+))?/i
    );
    if (eternaMatch) {
      const rawModel = eternaMatch[1].replace(/\s+/g, ' ').trim();
      const modelName = rawModel;
      const modelKey = modelName.toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (!seenModels.has(modelKey)) {
        seenModels.add(modelKey);
        const kw = eternaMatch[2] ? eternaMatch[2].replace(',', '.') : '';
        const hp = eternaMatch[3] ? eternaMatch[3].replace(',', '.') : '';
        const del = eternaMatch[4] || '50';
        const solid = eternaMatch[7] || (modelName.includes('370') ? '18' : '22');
        const headValues = (eternaMatch[8] || '')
          .trim()
          .split(/[\s,]+/)
          .map((v) => Number(v.replace(',', '.')))
          .filter((n) => !isNaN(n) && n > 0);

        const minHead = headValues.length ? Math.min(...headValues) : '';
        const maxHead = headValues.length ? Math.max(...headValues) : '';
        const headStr = modelName.includes('370') ? '4 - 10 m' : modelName.includes('750') ? '6 - 12 m' : '8 - 19 m';
        const flowStr = modelName.includes('370') ? '66 - 171 LPM' : modelName.includes('750') ? '120 - 312 LPM' : '96 - 396 LPM';

        products.push({
          product_name: modelName,
          code: modelName,
          category: currentCategory,
          group_name: 'Submersible Sewage / Dewatering Pumps',
          hp: hp ? `${hp} HP` : '',
          kw: kw ? `${kw} kW` : '',
          head: headStr,
          flow_rate: flowStr,
          pipe_size: `${del} mm`,
          solid_size: `${solid} mm`,
          stages: '1',
          price: 0,
          gst_rate: 18,
          unit: 'piece',
        });
      }
      continue;
    }

    // 4. KOS-M and KOS Openwell Models Row (e.g. "1 KOS - 116M 0.75 1.0 50 40 415...", "1 KOS - 314 2.2 3.0 80 80 380...", "KOSM")
    const kosMatch = line.match(
      /(?:^\d+\s+)?\b((?:KOS(?:[- ]?M)?|KOSM)(?:\s*[-–]?\s*\d+(?:\.\d+)?M?)?)\b(?:\s+([\d\.,]+))?(?:\s+([\d\.,]+))?(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+([\d\.\s,\/\-]+))?/i
    );
    if (kosMatch && kosMatch[1] && (kosMatch[2] || /\d/.test(kosMatch[1]) || kosMatch[1].toUpperCase().includes('KOSM'))) {
      const rawModel = kosMatch[1].replace(/\s+/g, ' ').trim();
      const isKosM = /KOS\s*[-–]?\s*[\d\.]+M|KOSM/i.test(rawModel) || currentSeries.includes('KOS-M');
      const numMatch = rawModel.match(/[\d\.]+/);
      let modelName = rawModel;
      let codeName = rawModel.replace(/\s+/g, '');

      if (isKosM && numMatch) {
        modelName = `KOSM - ${numMatch[0]} (KOS - ${numMatch[0]}M)`;
        codeName = `KOSM-${numMatch[0]}`;
      } else if (!isKosM && numMatch) {
        modelName = `KOS - ${numMatch[0]}`;
        codeName = `KOS-${numMatch[0]}`;
      } else if (rawModel.toUpperCase() === 'KOSM') {
        modelName = 'KOSM';
        codeName = 'KOSM';
      }

      const modelKey = codeName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const rawKey = rawModel.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const numOnly = (rawModel.match(/[\d\.]+/) || [''])[0].replace(/[^0-9]/g, '');

      if (!seenModels.has(modelKey) && !seenModels.has(rawKey)) {
        seenModels.add(modelKey);
        seenModels.add(rawKey);
        if (numOnly) {
          seenModels.add(`KOSM${numOnly}`);
          seenModels.add(`KOS${numOnly}M`);
          seenModels.add(`KOS${numOnly}`);
        }
        const kw = kosMatch[2] ? kosMatch[2].replace(',', '.') : (modelName === 'KOSM' ? '0.75 - 1.5' : '');
        const hp = kosMatch[3] ? kosMatch[3].replace(',', '.') : (modelName === 'KOSM' ? '1.0 - 2.0' : '');
        const suc = kosMatch[4] || (isKosM ? '50' : '80');
        const del = kosMatch[5] || (isKosM ? '40' : '65');

        products.push({
          product_name: modelName,
          code: codeName,
          category: currentCategory,
          group_name: 'Openwell Submersible Pumps',
          hp: hp ? `${hp} HP` : '',
          kw: kw ? `${kw} kW` : '',
          head: isKosM ? '8 - 28 m' : '8 - 60 m',
          flow_rate: isKosM ? '1.5 - 6.0 LPS' : '5 - 38 LPS',
          pipe_size: `${suc} x ${del} mm`,
          solid_size: '-',
          stages: '1',
          price: 0,
          gst_rate: 18,
          unit: 'piece',
        });
      }
      continue;
    }
  }

  // STRATEGY 2: Global Token Scanner (Catches all models even if table text is unstructured)
  const globalModelRegex =
    /\b((?:KSIL\s*[\/\\]\s*KCIL|KCIL\s*[\/\\]\s*KSIL|KCIL|KSIL)\s*\d+(?:\s*[-–]\s*\d+(?:\s*[-–]\s*\d+)?)?|KVM\s*[-–]?\s*\d{3,5}|ETERNA\s+\d+\s*CW\+?|(?:KOS(?:[- ]?M)?|KOSM)(?:\s*[-–]?\s*\d+(?:\.\d+)?M?)?)\b/gi;

  let tokenMatch;
  while ((tokenMatch = globalModelRegex.exec(normalizedText)) !== null) {
    const rawModel = tokenMatch[1].replace(/\s+/g, ' ').replace(/--+/g, '-').trim();
    const modelKey = rawModel.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const numOnly = (rawModel.match(/[\d\.]+/) || [''])[0].replace(/[^0-9]/g, '');

    if (
      !seenModels.has(modelKey) &&
      (!numOnly || (!seenModels.has(`KOSM${numOnly}`) && !seenModels.has(`KOS${numOnly}M`))) &&
      (/\d/.test(rawModel) || rawModel.toUpperCase().includes('KOSM'))
    ) {
      seenModels.add(modelKey);
      const isKvm = rawModel.startsWith('KVM');
      const isEterna = rawModel.toUpperCase().includes('ETERNA');
      const isKosM = /KOS\s*[-–]?\s*[\d\.]+M|KOSM/i.test(rawModel);
      const isKos = rawModel.startsWith('KOS');

      let pipeSize = '32 x 32 mm';
      let flow = 'Up to 90 m³/hr';
      let hp = '';
      let kw = '';
      let head = '';
      let solid = '-';
      let grp = 'Vertical Multistage Inline Pumps';

      if (isEterna) {
        pipeSize = '50 mm';
        flow = rawModel.includes('370') ? '66 - 171 LPM' : rawModel.includes('750') ? '120 - 312 LPM' : '96 - 396 LPM';
        hp = rawModel.includes('370') ? '0.5 HP' : rawModel.includes('750') ? '1.0 HP' : '2.0 HP';
        kw = rawModel.includes('370') ? '0.37 kW' : rawModel.includes('750') ? '0.75 kW' : '1.5 kW';
        head = rawModel.includes('370') ? '4 - 10 m' : rawModel.includes('750') ? '6 - 12 m' : '8 - 19 m';
        solid = rawModel.includes('370') ? '18 mm' : '22 mm';
        grp = 'Submersible Sewage / Dewatering Pumps';
      } else if (isKvm) {
        pipeSize = `${inferKvmPipe(rawModel)} x ${inferKvmPipe(rawModel)} mm`;
        flow = inferKvmFlow(rawModel);
        grp = 'KVM Multistage Inline Pumps';
      } else if (isKosM) {
        pipeSize = '50 x 40 mm';
        flow = '1.5 - 6.0 LPS';
        head = '8 - 28 m';
        grp = 'Openwell Submersible Pumps';
      } else if (isKos) {
        pipeSize = '80 x 65 mm';
        flow = '5 - 38 LPS';
        head = '8 - 60 m';
        grp = 'Openwell Submersible Pumps';
      } else {
        pipeSize = `${inferPipeSize(rawModel)} x ${inferPipeSize(rawModel)} mm`;
        flow = inferFlow(rawModel);
      }

      products.push({
        product_name: isKosM && /\d/.test(rawModel) ? `KOSM - ${rawModel.replace(/[^0-9.]/g, '')} (${rawModel})` : rawModel,
        code: rawModel.replace(/\s+/g, ''),
        category: defaultCategory || 'DEWAS',
        group_name: grp,
        hp: hp,
        kw: kw,
        head: head,
        flow_rate: flow,
        pipe_size: pipeSize,
        solid_size: solid,
        stages: isEterna || isKos ? '1' : '',
        price: 0,
        gst_rate: 18,
        unit: 'piece',
      });
    }
  }

  return products;
}

function inferPipeSize(model) {
  const m = model.toUpperCase();
  if (m.includes('32-') || m.includes('KCIL32')) return '74';
  if (m.includes('45-') || m.includes('KCIL45')) return '80';
  if (m.includes('64-') || m.includes('KCIL64')) return '100';
  if (m.includes('90-') || m.includes('KCIL90')) return '100';
  if (m.includes('10-') || m.includes('KCIL10')) return '42';
  if (m.includes('15-') || m.includes('KCIL15')) return '65';
  if (m.includes('20-') || m.includes('KCIL20')) return '65';
  return '32';
}

function inferFlow(model) {
  const match = model.match(/\d+/);
  if (match) {
    return `${match[0]} m³/hr nominal`;
  }
  return 'Up to 90 m³/hr';
}

function inferKvmPipe(model) {
  if (model.includes('20')) return '25';
  if (model.includes('40')) return '32';
  if (model.includes('100')) return '42';
  if (model.includes('150')) return '65';
  return '25';
}

function inferKvmFlow(model) {
  if (model.includes('20')) return '2 m³/hr nominal';
  if (model.includes('40')) return '4 m³/hr nominal';
  if (model.includes('100')) return '10 m³/hr nominal';
  if (model.includes('150')) return '15 m³/hr nominal';
  return '2 - 15 m³/hr';
}
