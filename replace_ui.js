const fs = require('fs');
const file = 'D:/Personal Projects/nivaari/components/nivaari/NivaariExperience.tsx';
let content = fs.readFileSync(file, 'utf8');

const sIdx = content.indexOf('{/* 2D UI overlay */}');
const eIdxStr = '      </div>\n      </>\n      )}\n    </div>\n  );\n}';
const eIdx = content.indexOf(eIdxStr) + 12;

if(sIdx > -1 && eIdx > -1) {
  const newOverlay = `      {/* 2D UI overlay */}
      <TheoUIOverlay
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        statsOpen={statsOpen}
        setStatsOpen={setStatsOpen}
        disasterMode={disasterMode}
        setDisasterMode={setDisasterMode}
        editMode={editMode}
        setEditMode={setEditMode}
        setEditingPositions={setEditingPositions}
        editingPositions={editingPositions}
        routeLabel={routeLabel}
        user={user}
      />`;

  const newContent = content.substring(0, sIdx) + newOverlay + '\n      </>\n      )}\n    </div>\n  );\n}';
  fs.writeFileSync(file, newContent);
  console.log('Replaced successfully!');
} else {
  console.log('Indexes not found', sIdx, eIdx);
}
