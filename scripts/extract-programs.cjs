const fs = require('fs');

async function main() {
  let textMedia = '';
  let textData = '';

  if (fs.existsSync('temp_chunk2.js') && fs.existsSync('temp_chunk1.js')) {
    textMedia = fs.readFileSync('temp_chunk2.js', 'utf8');
    textData = fs.readFileSync('temp_chunk1.js', 'utf8');
  } else {
    console.log('Downloading chunks from app...');
    textData = await (await fetch('https://fitness-pro--fitness-pro-87a9f.us-central1.hosted.app/_next/static/chunks/1e67bcdb1a360460.js')).text();
    textMedia = await (await fetch('https://fitness-pro--fitness-pro-87a9f.us-central1.hosted.app/_next/static/chunks/88122924ac8850e9.js')).text();
  }

  // 1. Male Video Map
  const maleStart = textMedia.indexOf('["MALE_EXERCISE_MAP",0,{') + 23;
  const maleEnd = textMedia.indexOf('}])}', maleStart);
  const maleRaw = textMedia.substring(maleStart, maleEnd);
  const maleMap = {};
  const pairRegex = /(?:([a-zA-Z0-9_]+)|"([^"]+)")\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = pairRegex.exec(maleRaw)) !== null) {
    const k = m[1] || m[2];
    maleMap[k] = m[3];
  }
  console.log('Male video entries count:', Object.keys(maleMap).length);

  // 2. Female Video Map
  const baseMuscleWiki = 'https://media.musclewiki.com/media/uploads/videos/branded';
  // IMPORTANT: Case-sensitive for MuscleWiki files (e.g. Bodyweight, Dumbbells, etc.)
  function femaleHelper(cat, slug, view = 'front') {
    return `${baseMuscleWiki}/female-${cat}-${slug}-${view}.mp4`;
  }
  const femaleStart = textMedia.indexOf('let d={u0cNiij:');
  const femaleEnd = textMedia.indexOf('};e.s(["FEMALE_EXERCISE_MAP"', femaleStart);
  const femaleRaw = textMedia.substring(femaleStart + 6, femaleEnd);
  const femaleMap = {};
  const fRegex1 = /(?:([a-zA-Z0-9_]+)|"([^"]+)")\s*:\s*i\(\s*"([^"]+)"\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]+)")?\s*\)/g;
  while ((m = fRegex1.exec(femaleRaw)) !== null) {
    const k = m[1] || m[2];
    femaleMap[k] = femaleHelper(m[3], m[4], m[5] || 'front');
  }
  const fRegex2 = /(?:([a-zA-Z0-9_]+)|"([^"]+)")\s*:\s*`\$\{a\}\/([^`]+)`/g;
  while ((m = fRegex2.exec(femaleRaw)) !== null) {
    const k = m[1] || m[2];
    femaleMap[k] = `${baseMuscleWiki}/${m[3]}`;
  }
  console.log('Female video entries count:', Object.keys(femaleMap).length);

  // 3. Extract JSON strings for Home and Gym
  const m2487 = textData.indexOf('2487,');
  const m53163 = textData.indexOf('53163,');

  const p1Start = textData.indexOf("JSON.parse('", m2487) + 12;
  const p1End = textData.indexOf("')", p1Start);
  const strHome = textData.substring(p1Start, p1End);
  const homeParsedObj = JSON.parse(eval("'" + strHome + "'"));
  const homePrograms = homeParsedObj.programs || homeParsedObj;
  console.log('Home programs count:', homePrograms.length);

  const p2Start = textData.indexOf("JSON.parse('", m53163) + 12;
  const p2End = textData.indexOf("')", p2Start);
  const strGym = textData.substring(p2Start, p2End);
  const gymParsedObj = JSON.parse(eval("'" + strGym + "'"));
  const gymPrograms = gymParsedObj.programs || gymParsedObj;
  console.log('Gym programs count:', gymPrograms.length);

  // 4. Enrich every exercise with direct video MP4 URL and fallback
  const femaleProgramIds = new Set([
    'home-gluteos',
    'home-femenino',
    'home-pilates',
    'home-celulitis',
    'home-tonificacion',
    'gym-gluteos'
  ]);

  function attachVideos(programs) {
    return programs.map(prog => {
      const isFemale = femaleProgramIds.has(prog.id);
      const routines = (prog.routines || []).map(rot => {
        const exercises = (rot.exercises || []).map(ex => {
          let videoUrl = null;
          let fallbackVideoUrl = null;

          if (isFemale && femaleMap[ex.exerciseDbId]) {
            videoUrl = femaleMap[ex.exerciseDbId];
            fallbackVideoUrl = maleMap[ex.exerciseDbId] || null;
          } else if (maleMap[ex.exerciseDbId]) {
            videoUrl = maleMap[ex.exerciseDbId];
            fallbackVideoUrl = femaleMap[ex.exerciseDbId] || null;
          } else if (femaleMap[ex.exerciseDbId]) {
            videoUrl = femaleMap[ex.exerciseDbId];
          }

          return {
            ...ex,
            videoUrl,
            fallbackVideoUrl,
            videoType: 'mp4',
          };
        });

        return {
          ...rot,
          exercises
        };
      });

      return {
        ...prog,
        routines
      };
    });
  }

  const enrichedHome = attachVideos(homePrograms);
  const enrichedGym = attachVideos(gymPrograms);

  const fullDataset = {
    homePrograms: enrichedHome,
    gymPrograms: enrichedGym,
    metadata: {
      totalPrograms: enrichedHome.length + enrichedGym.length,
      homeProgramsCount: enrichedHome.length,
      gymProgramsCount: enrichedGym.length,
      extractedAt: new Date().toISOString()
    }
  };

  fs.writeFileSync('src/data/programsDataset.json', JSON.stringify(fullDataset, null, 2), 'utf8');
  console.log('Successfully saved corrected dataset to src/data/programsDataset.json!');
}

main().catch(console.error);
