export function parseCatalogText(text) {
  if (!text || typeof text !== 'string') return [];

  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const products = [];
  const seenModels = new Set();

  let currentSeries = '';
  let currentCategory = 'DEWAS';
  let currentGroup = 'Pumps';
  let currentFlowNominal = '';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Detect Series Header
    if (/KVM\s+(\d+(?:\.\d+)?)\s*(?:m3\/hr|m³\/hr)?\s*SERIES/i.test(line)) {
      const match = line.match(/KVM\s+(\d+(?:\.\d+)?)\s*(?:m3\/hr|m³\/hr)?\s*SERIES/i);
      currentFlowNominal = match ? `${match[1]} m3/hr` : '';
      currentSeries = `KVM ${currentFlowNominal} Series`;
      currentGroup = 'KVM Multistage Inline Pumps';
      currentCategory = 'DEWAS';
      continue;
    } else if (/(?:KCIL\s*\/\s*KSIL|KSIL\s*\/\s*KCIL|KCIL|KSIL)\s*PUMPSETS?\s*[-–]\s*(\d+)\s*SERIES/i.test(line)) {
      const match = line.match(/(?:KCIL\s*\/\s*KSIL|KSIL\s*\/\s*KCIL|KCIL|KSIL)\s*PUMPSETS?\s*[-–]\s*(\d+)\s*SERIES/i);
      currentSeries = `KSIL/KCIL ${match ? match[1] : ''} Series`;
      currentGroup = 'Vertical Multistage Inline Pumps';
      currentCategory = 'DEWAS';
      continue;
    } else if (/ETERNA\s+CW\+/i.test(line)) {
      currentSeries = 'ETERNA CW+ Series';
      currentGroup = 'Submersible Sewage Pumps';
      currentCategory = 'DEWAS';
      continue;
    }

    // 1. Check for KVM Models: e.g. "1 KVM - 2070 1.1 1.5 25 25 10 77 75 70 66 53 46 38 29 20"
    const kvmMatch = line.match(/(?:^\d+\s+)?(KVM\s*[-–]\s*\d+)\s+([\d\.]+)\s+([\d\.]+)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+([\d\.\s\-]+))?/i);
    if (kvmMatch) {
      const modelName = kvmMatch[1].replace(/\s+/g, '');
      if (!seenModels.has(modelName.toUpperCase())) {
        seenModels.add(modelName.toUpperCase());
        const kw = kvmMatch[2];
        const hp = kvmMatch[3];
        const suc = kvmMatch[4];
        const del = kvmMatch[5];
        const stages = kvmMatch[6];
        const headValues = (kvmMatch[7] || '').trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
        const minHead = headValues.length ? Math.min(...headValues) : '';
        const maxHead = headValues.length ? Math.max(...headValues) : '';
        const headStr = minHead && maxHead ? (minHead === maxHead ? `${minHead} m` : `${minHead} - ${maxHead} m`) : '';

        products.push({
          product_name: modelName,
          code: modelName,
          category: currentCategory,
          group_name: currentGroup,
          hp: `${hp} HP`,
          kw: `${kw} kW`,
          head: headStr,
          flow_rate: currentFlowNominal || 'Nominal Flow',
          pipe_size: `${suc} x ${del} mm`,
          solid_size: '-',
          stages: stages,
          price: 0,
          gst_rate: 18,
          unit: 'piece'
        });
      }
      continue;
    }

    // 2. Check for KSIL / KCIL Models: e.g. "1 KSIL/KCIL1-2 0.37 0.5 32 32 2 12 12 12 12..." or "KCIL32-1-1 1.5 2.0 74 74 1..."
    const kcilMatch = line.match(/(?:^\d+\s+)?((?:KSIL\s*\/\s*KCIL|KCIL|KSIL)\s*[\d\-]+(?:\s*-\s*\d+)?)\s+([\d\.,]+)\s+([\d\.,]+)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+([\d\.\s\-]+))?/i);
    if (kcilMatch) {
      const modelName = kcilMatch[1].replace(/\s+/g, '');
      if (!seenModels.has(modelName.toUpperCase())) {
        seenModels.add(modelName.toUpperCase());
        const kw = kcilMatch[2].replace(',', '.');
        const hp = kcilMatch[3].replace(',', '.');
        const suc = kcilMatch[4];
        const del = kcilMatch[5];
        const stages = kcilMatch[6];
        const headValues = (kcilMatch[7] || '').trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
        const minHead = headValues.length ? Math.min(...headValues) : '';
        const maxHead = headValues.length ? Math.max(...headValues) : '';
        const headStr = minHead && maxHead ? (minHead === maxHead ? `${minHead} m` : `${minHead} - ${maxHead} m`) : '';

        products.push({
          product_name: modelName,
          code: modelName,
          category: currentCategory,
          group_name: currentGroup || 'Vertical Multistage Inline Pumps',
          hp: `${hp} HP`,
          kw: `${kw} kW`,
          head: headStr,
          flow_rate: currentSeries ? currentSeries.replace('PUMPSETS', '').trim() : '',
          pipe_size: `${suc} x ${del} mm`,
          solid_size: '-',
          stages: stages,
          price: 0,
          gst_rate: 18,
          unit: 'piece'
        });
      }
      continue;
    }

    // 3. Check for ETERNA CW+ Models: e.g. "1 ETERNA 370 CW+ 0.37 0.5 50 210V 2800 18 171 144 114 66"
    const eternaMatch = line.match(/(?:^\d+\s+)?(ETERNA\s+\d+\s*CW\+?)\s+([\d\.]+)\s+([\d\.]+)\s+(\d+)\s+(?:[\w\d]+)?\s*(?:[\w\d]+)?\s*(\d+)?(?:\s+([\d\.\s\-]+))?/i);
    if (eternaMatch) {
      const modelName = eternaMatch[1].trim();
      if (!seenModels.has(modelName.toUpperCase())) {
        seenModels.add(modelName.toUpperCase());
        const kw = eternaMatch[2];
        const hp = eternaMatch[3];
        const pipeSize = eternaMatch[4];
        const solidSize = eternaMatch[5] || '22';
        const flowValues = (eternaMatch[6] || '').trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
        const minFlow = flowValues.length ? Math.min(...flowValues) : '';
        const maxFlow = flowValues.length ? Math.max(...flowValues) : '';
        const flowStr = minFlow && maxFlow ? (minFlow === maxFlow ? `${minFlow} LPM` : `${minFlow} - ${maxFlow} LPM`) : '';

        products.push({
          product_name: modelName,
          code: modelName,
          category: 'DEWAS',
          group_name: 'Submersible Sewage Pumps',
          hp: `${hp} HP`,
          kw: `${kw} kW`,
          head: modelName.includes('370') ? '4 - 12 m' : modelName.includes('750') ? '6 - 14 m' : '8 - 19 m',
          flow_rate: flowStr || 'Up to 396 LPM',
          pipe_size: `${pipeSize} mm DEL`,
          solid_size: `${solidSize} mm`,
          stages: '1',
          price: 0,
          gst_rate: 18,
          unit: 'piece'
        });
      }
      continue;
    }

    // 4. Generic Pump Row (e.g. Model, HP, Rate, Head, Flow)
    const genericMatch = line.match(/^([A-Z0-9\-\/\.\s]{3,30}?)\s+(\d+(?:\.\d+)?)\s*(?:HP|kW)\s*(?:head[:\s]*([\d\-\.]+))?\s*(?:flow[:\s]*([\d\-\.]+))?/i);
    if (genericMatch && !seenModels.has(genericMatch[1].trim().toUpperCase()) && genericMatch[1].trim().length > 2) {
      const modelName = genericMatch[1].trim();
      seenModels.add(modelName.toUpperCase());
      products.push({
        product_name: modelName,
        code: modelName,
        category: currentCategory,
        group_name: currentGroup,
        hp: `${genericMatch[2]} HP`,
        kw: '',
        head: genericMatch[3] ? `${genericMatch[3]} m` : '',
        flow_rate: genericMatch[4] || '',
        pipe_size: '',
        solid_size: '',
        stages: '',
        price: 0,
        gst_rate: 18,
        unit: 'piece'
      });
    }
  }

  return products;
}
