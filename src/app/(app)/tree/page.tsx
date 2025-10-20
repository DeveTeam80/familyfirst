"use client";

import * as React from "react";
import { Box, Avatar, Typography, Paper } from "@mui/material";
import { Tree, TreeNode } from "react-organizational-chart";

// Example family data (you can later fetch from Firebase)
const family = {
  paternalGrandparents: {
    grandfather: { name: "Grandfather", avatar: "/avatars/grandfather1.png" },
    grandmother: { name: "Grandmother", avatar: "/avatars/grandmother1.png" },
  },
  maternalGrandparents: {
    grandfather: { name: "Grandfather", avatar: "/avatars/grandfather2.png" },
    grandmother: { name: "Grandmother", avatar: "/avatars/grandmother2.png" },
  },
  fatherSide: {
    aunt: { name: "Auntie", avatar: "/avatars/aunt.png" },
    father: { name: "Father", avatar: "/avatars/father.png" },
    uncle: { name: "Uncle", avatar: "/avatars/uncle.png" },
  },
  mother: { name: "Mother", avatar: "/avatars/mother.png" },
  children: [
    { name: "Brother", avatar: "/avatars/brother.png" },
    { name: "Me", avatar: "/avatars/me.png" },
    { name: "Sister", avatar: "/avatars/sister.png" },
  ],
};

// Reusable node component
function PersonNode({ name, avatar }: { name: string; avatar: string }) {
  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 1,
        borderRadius: 2,
        minWidth: 100,
        backgroundColor: "background.paper",
        color: "text.primary",
      }}
    >
      <Avatar
        src={avatar}
        alt={name}
        sx={{
          width: 72,
          height: 72,
          mb: 1,
          border: "2px solid",
          borderColor: "divider",
        }}
      />
      <Typography variant="body2" fontWeight={500}>
        {name}
      </Typography>
    </Paper>
  );
}

export default function FamilyTreePage() {
  return (
    <Box
      sx={{
        p: 3,
        textAlign: "center",
        overflowX: "auto",
        minHeight: "80vh",
      }}
    >
      <Typography
        variant="h5"
        sx={{ mb: 4, fontWeight: 600, letterSpacing: 1 }}
      >
        Family Tree
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Tree
          lineWidth={"2px"}
          lineColor={"#90caf9"}
          lineBorderRadius={"10px"}
          label={
            <Box display="flex" gap={8}>
              <PersonNode {...family.paternalGrandparents.grandfather} />
              <PersonNode {...family.paternalGrandparents.grandmother} />
              <PersonNode {...family.maternalGrandparents.grandfather} />
              <PersonNode {...family.maternalGrandparents.grandmother} />
            </Box>
          }
        >
          {/* Father Side */}
          <TreeNode
            label={
              <Box display="flex" gap={3}>
                <PersonNode {...family.fatherSide.aunt} />
                <PersonNode {...family.fatherSide.father} />
                <PersonNode {...family.fatherSide.uncle} />
              </Box>
            }
          >
            {/* Parents */}
            <TreeNode
              label={
                <Box display="flex" gap={3} justifyContent="center">
                  <PersonNode {...family.fatherSide.father} />
                  <PersonNode {...family.mother} />
                </Box>
              }
            >
              {/* Children */}
              <Box display="flex" justifyContent="center" gap={3} mt={2}>
                {family.children.map((child) => (
                  <PersonNode
                    key={child.name}
                    name={child.name}
                    avatar={child.avatar}
                  />
                ))}
              </Box>
            </TreeNode>
          </TreeNode>
        </Tree>
      </Box>
    </Box>
  );
}

// "use client";

// import React from "react";
// import ReactFlow, {
//   Background,
//   Controls,
//   MiniMap,
//   Handle,
//   Position,
// } from "reactflow";
// import "reactflow/dist/style.css";
// import { Box, Avatar, Typography, Paper } from "@mui/material";

// /* ------------------- Person Node Component ------------------- */
// function PersonNode({ data }: { data: { name: string; avatar?: string } }) {
//   return (
//     <Paper
//       elevation={3}
//       sx={{
//         p: 1,
//         borderRadius: 2,
//         minWidth: 120,
//         textAlign: "center",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         backgroundColor: "background.paper",
//         border: "1px solid",
//         borderColor: "divider",
//       }}
//     >
//       <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
//       <Avatar
//         src={data.avatar}
//         sx={{ width: 64, height: 64, mb: 0.5, border: "1px solid #ccc" }}
//       />
//       <Typography variant="body2" fontWeight={600}>
//         {data.name}
//       </Typography>
//       <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
//     </Paper>
//   );
// }

// /* ------------------- Node Types ------------------- */
// const nodeTypes = { person: PersonNode };

// /* ------------------- Demo Data ------------------- */
// const nodes = [
//   // Grandparents
//   { id: "pgf", type: "person", data: { name: "Paternal Grandfather" }, position: { x: 0, y: 0 } },
//   { id: "pgm", type: "person", data: { name: "Paternal Grandmother" }, position: { x: 160, y: 0 } },
//   { id: "mgf", type: "person", data: { name: "Maternal Grandfather" }, position: { x: 620, y: 0 } },
//   { id: "mgm", type: "person", data: { name: "Maternal Grandmother" }, position: { x: 780, y: 0 } },

//   // Parents
//   { id: "father", type: "person", data: { name: "Father" }, position: { x: 80, y: 150 } },
//   { id: "mother", type: "person", data: { name: "Mother" }, position: { x: 700, y: 150 } },

//   // Father’s siblings
//   { id: "fs1", type: "person", data: { name: "Father’s Sibling 1" }, position: { x: -100, y: 150 } },
//   { id: "fs2", type: "person", data: { name: "Father’s Sibling 2" }, position: { x: -240, y: 150 } },

//   // Mother’s siblings
//   { id: "ms1", type: "person", data: { name: "Mother’s Sibling 1" }, position: { x: 940, y: 150 } },
//   { id: "ms2", type: "person", data: { name: "Mother’s Sibling 2" }, position: { x: 1080, y: 150 } },

//   // User generation
//   { id: "user", type: "person", data: { name: "You" }, position: { x: 420, y: 300 } },
//   { id: "spouse", type: "person", data: { name: "Your Spouse" }, position: { x: 260, y: 300 } },
//   { id: "sib1", type: "person", data: { name: "Sibling 1" }, position: { x: 580, y: 300 } },
//   { id: "sib2", type: "person", data: { name: "Sibling 2" }, position: { x: 740, y: 300 } },
// ];

// const edges = [
//   // Paternal grandparents → Father
//   { id: "pgf-father", source: "pgf", target: "father" },
//   { id: "pgm-father", source: "pgm", target: "father" },

//   // Maternal grandparents → Mother
//   { id: "mgf-mother", source: "mgf", target: "mother" },
//   { id: "mgm-mother", source: "mgm", target: "mother" },

//   // Father’s siblings
//   { id: "pgf-fs1", source: "pgf", target: "fs1" },
//   { id: "pgf-fs2", source: "pgf", target: "fs2" },

//   // Mother’s siblings
//   { id: "mgf-ms1", source: "mgf", target: "ms1" },
//   { id: "mgf-ms2", source: "mgf", target: "ms2" },

//   // Parents → User generation
//   { id: "father-user", source: "father", target: "user" },
//   { id: "mother-user", source: "mother", target: "user" },

//   { id: "father-spouse", source: "father", target: "spouse" },
//   { id: "father-sibs", source: "father", target: "sib1" },
//   { id: "mother-sibs", source: "mother", target: "sib1" },
//   { id: "mother-sibs2", source: "mother", target: "sib2" },
// ];

// /* ------------------- Component ------------------- */

// export default function FamilyGraph() {
//   return (
//     <Box sx={{ height: "85vh", width: "100%", backgroundColor: "#fafafa" }}>
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         nodeTypes={nodeTypes}
//         fitView
//         defaultEdgeOptions={{
//           style: { stroke: "#90caf9", strokeWidth: 2 },
//         }}
//       >
//         <MiniMap />
//         <Controls />
//         <Background color="#ddd" gap={20} />
//       </ReactFlow>
//     </Box>
//   );
// }
