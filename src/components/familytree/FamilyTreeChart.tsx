// src/components/familytree/FamilyTreeChart.tsx
import React, {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Theme } from "@mui/material/styles";
import {
  FamilyTreeChartHandle,
  FamilyTreeNode,
  F3CardData,
  RelationType,
} from "./types";

interface FamilyTreeChartProps {
  isAdmin: boolean;
  isMobile: boolean;
  theme: Theme;
  treeData: FamilyTreeNode[];
  onNodeSelect?: (node: FamilyTreeNode) => void;
  onAddRelative?: (
    parentId: string,
    relationType: RelationType,
    specificRole: string
  ) => void;
  onAddModeChange?: (isAddMode: boolean) => void;
}

export const FamilyTreeChart = forwardRef<
  FamilyTreeChartHandle,
  FamilyTreeChartProps
>(
  (
    {
      isAdmin,
      isMobile,
      theme,
      treeData,
      onNodeSelect,
      onAddRelative,
      onAddModeChange,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f3ChartInstance = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f3EditTreeRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f3LibRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeChartDataRef = useRef<any[]>([]);
    const onNodeSelectRef = useRef(onNodeSelect);
    const onAddRelativeRef = useRef(onAddRelative);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevTreeDataRef = useRef<any[]>([]);

    onNodeSelectRef.current = onNodeSelect;
    onAddRelativeRef.current = onAddRelative;

    const createChart = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f3: any, dataProps: any[]) => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = "";
        const dataClone = JSON.parse(JSON.stringify(dataProps));
        activeChartDataRef.current = dataClone;
        prevTreeDataRef.current = dataProps;

        const f3Chart = f3
          .createChart("#FamilyChart", dataClone)
          .setTransitionTime(1000)
          .setCardXSpacing(isMobile ? 200 : 260)
          .setCardYSpacing(isMobile ? 120 : 160)
          .setShowSiblingsOfMain(true)
          .setOrientationVertical();

        const f3Card = f3Chart
          .setCardHtml()
          .setCardDim({
            width: 240,
            height: 100,
            inner_width: 240,
            inner_height: 100,
          })
          .setMiniTree(true)
          .setStyle("imageCircle")
          .setOnHoverPathToMain();

        // -----------------------------------------------------------
        // 🎨 CUSTOM CARD HTML CREATOR (FIXED)
        // -----------------------------------------------------------
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        f3Card.setCardInnerHtmlCreator((d: any) => {
          // 1. HANDLE "ADD" BUTTONS (Virtual/Ghost Nodes)
          if (d.data.to_add || d.data._new_rel_data) {
            const label = d.data.label || d.data["first name"] || "Add Relative";
            return `
               <div class="custom-card card-add">
                 <div class="add-icon">+</div>
                 <div class="add-label">${label}</div>
               </div>
            `;
          }

          // 2. HANDLE REAL NODES
          // IMPORTANT: The data is nested in d.data.data because d.data is the Node object
          const node = d.data;     // The Node object { id, data: {...}, rels: ... }
          const userData = node.data || {}; // The actual user data { "first name": ... }

          const image = userData.avatar || userData.photoUrl || "https://i.pravatar.cc/150?img=12";
          const firstName = userData["first name"] || "Unknown";
          const lastName = userData["last name"] || "";

          // Dates
          const birthYear = userData.birthday ? new Date(userData.birthday).getFullYear() : "";
          const deathYear = userData.deathDate ? new Date(userData.deathDate).getFullYear() : "";
          const dateString = deathYear ? `${birthYear} - ${deathYear}` : birthYear;

          // Status Flags
          const isDeceased = !!userData.deathDate;
          const genderClass = userData.gender === "M" ? "male" : "female";
          const deceasedClass = isDeceased ? "card-deceased" : "";

          return `
             <div class="custom-card card-profile ${genderClass} ${deceasedClass}">
                ${isDeceased ? '<div class="ribbon">In Memory</div>' : ''}
                
                <div class="card-image-wrapper">
                  <img src="${image}" class="card-avatar" alt="avatar"/>
                </div>
                
                <div class="card-details">
                   <div class="card-name" title="${firstName} ${lastName}">
                      ${firstName} ${lastName}
                   </div>
                   <div class="card-dates">${dateString}</div>
                   ${userData.weddingAnniversary ? `<div class="card-anniversary">💍 ${new Date(userData.weddingAnniversary).getFullYear()}</div>` : ''}
                </div>
             </div>
           `;
        });

        if (isAdmin) {
          const editTree = f3Chart
            .editTree()
            .fixed(true)
            .setFields(["first name"])
            .setEditFirst(false);
          f3EditTreeRef.current = editTree;
        }

        // -----------------------------------------------------------
        // ✅ CLICK HANDLER
        // -----------------------------------------------------------
        f3Card.setOnCardClick((e: MouseEvent, d: F3CardData) => {
          e.stopPropagation();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dataAny = d.data as any;

          // GHOST NODE
          if (dataAny._new_rel_data) {
            const handler = onAddRelativeRef.current;
            const relData = dataAny._new_rel_data;
            const realParentId = relData.rel_id || dataAny.id;
            const rawRelType = relData.rel_type;

            let appRelType: RelationType | null = null;
            if (rawRelType === "son" || rawRelType === "daughter") appRelType = "children";
            else if (rawRelType === "spouse") appRelType = "spouses";
            else if (rawRelType === "father" || rawRelType === "mother") appRelType = "parents";

            if (realParentId && appRelType && rawRelType && handler) {
              if (f3EditTreeRef.current?.closeForm) f3EditTreeRef.current.closeForm();
              handler(realParentId, appRelType, rawRelType);
            }
            return;
          }

          // VIRTUAL NODE
          if (dataAny.to_add) {
            const childId = dataAny.rels?.children?.[0];
            const spouseId = dataAny.rels?.spouses?.[0];
            const name = dataAny["first name"] || dataAny.label || "";

            let role = "father";
            if (name === "Add Mother") role = "mother";
            else if (name === "Add Father") role = "father";
            else if (spouseId) {
              const spouse = activeChartDataRef.current.find((n) => n.id === spouseId);
              if (spouse) role = spouse.data.gender === "M" ? "mother" : "father";
            }

            if (childId && onAddRelativeRef.current) {
              if (f3EditTreeRef.current?.closeForm) f3EditTreeRef.current.closeForm();
              onAddRelativeRef.current(childId, "parents", role);
            } else if (spouseId && onAddRelativeRef.current) {
              if (f3EditTreeRef.current?.closeForm) f3EditTreeRef.current.closeForm();
              onAddRelativeRef.current(spouseId, "spouses", role);
            }
            return;
          }

          // REAL NODE
          const nodeData = activeChartDataRef.current.find((n) => n.id === d.data.id);
          if (nodeData) {
            if (onNodeSelectRef.current) {
              onNodeSelectRef.current(nodeData);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cardAny = f3Card as any;
            if (cardAny.onCardClickDefault) {
              cardAny.onCardClickDefault(e, d);
            }
          }
        });

        // Ensure proper cursor styling
        f3Card.setOnCardUpdate(function (this: HTMLElement, d: F3CardData) {
          this.style.cursor = "pointer";
        });

        f3Chart.updateTree({ initial: true });
        f3ChartInstance.current = f3Chart;
      },
      [isAdmin, isMobile]
    );

    // ... (Cleanup & Lifecycle) ...
    const performExitAddMode = useCallback(() => {
      try {
        if (f3EditTreeRef.current?.addRelativeInstance?.onCancel) {
          f3EditTreeRef.current.addRelativeInstance.onCancel();
        }
        if (f3EditTreeRef.current?.closeForm) {
          f3EditTreeRef.current.closeForm();
        }
      } catch (e) {
        console.warn(e);
      }
      if (onAddModeChange) onAddModeChange(false);
    }, [onAddModeChange]);

    useEffect(() => {
      if (prevTreeDataRef.current === treeData) return;
      if (f3LibRef.current && treeData.length > 0) {
        createChart(f3LibRef.current, treeData);
      }
    }, [treeData, createChart]);

    const loadFamilyChart = useCallback(async () => {
      if (!containerRef.current) return;
      try {
        const f3Module = await import("family-chart");
        const f3 = f3Module.default || f3Module;
        f3LibRef.current = f3;
        createChart(f3, treeData);
      } catch (error) {
        console.error("❌ Error loading family chart:", error);
      }
    }, [createChart, treeData]);

    useEffect(() => {
      if (treeData.length > 0) {
        loadFamilyChart();
      }
    }, [loadFamilyChart, treeData]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const handleBgClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.classList.contains("f3-cont") ||
          target.tagName === "svg"
        ) {
          performExitAddMode();
        }
      };
      container.addEventListener("click", handleBgClick);
      return () => container.removeEventListener("click", handleBgClick);
    }, [performExitAddMode]);

    useImperativeHandle(ref, () => ({
      resetView: () => {
        performExitAddMode();
        if (containerRef.current && f3LibRef.current && treeData.length > 0) {
          containerRef.current.innerHTML = "";
          createChart(f3LibRef.current, treeData);
        }
      },
      triggerAddMode: (nodeId: string) => {
        if (f3ChartInstance.current && f3EditTreeRef.current) {
          const node = activeChartDataRef.current.find((n) => n.id === nodeId);
          if (node) {
            f3ChartInstance.current.updateTree({ main_id: nodeId });
            f3EditTreeRef.current.open(node);
            if (onAddModeChange) onAddModeChange(true);
            setTimeout(() => {
              const addBtn = document.querySelector(
                ".f3-add-relative-btn"
              ) as HTMLElement;
              if (addBtn) addBtn.click();
            }, 0);
          }
        }
      },
      cancelAddMode: () => {
        performExitAddMode();
      },
    }));

    const bgColor = theme.palette.mode === "dark" ? "#1a1229" : "#faf8ff";

    return (
      <>
        {/* DARK THEME + CARD STYLES */}
        <style jsx global>{`
          .f3-form-cont {
            display: none !important;
          }
          .f3-card-edit, g.f3-card-edit {
            pointer-events: auto !important;
            cursor: pointer !important;
          }

          /* --- CARD CONTAINER --- */
          .custom-card {
            width: 240px;
            height: 100px;
            display: flex;
            align-items: center;
            border-radius: 16px;
            padding: 10px;
            position: relative;
            overflow: visible;
            box-sizing: border-box;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }

          /* --- PROFILE CARD STYLE (Dark Theme) --- */
          .card-profile {
            background: linear-gradient(145deg, #2d2438, #1e1b2e); /* Deep Purple/Black */
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            color: #fff;
          }
          .card-profile:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
            border-color: rgba(255, 255, 255, 0.3);
          }

          /* --- GENDER ACCENTS (Subtle Borders/Glows) --- */
          .card-profile.male .card-image-wrapper {
            border-color: #60a5fa; /* Blue */
            box-shadow: 0 0 10px rgba(96, 165, 250, 0.2);
          }
          .card-profile.female .card-image-wrapper {
            border-color: #f472b6; /* Pink */
            box-shadow: 0 0 10px rgba(244, 114, 182, 0.2);
          }

          /* --- AVATAR --- */
          .card-image-wrapper {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            border: 2px solid #444;
            background: #000;
          }
          .card-avatar {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          /* --- TEXT DETAILS --- */
          .card-details {
            margin-left: 14px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
            flex: 1;
          }
          .card-name {
            font-weight: 600;
            font-size: 15px;
            color: #ececec;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 4px;
          }
          .card-dates {
            font-size: 12px;
            color: #9ca3af; /* Grey text */
            font-family: monospace;
          }
          .card-anniversary {
            font-size: 11px;
            color: #d8b4fe; /* Light Purple */
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          /* --- ADD BUTTON STYLE --- */
.card-add {
  background: rgba(30, 27, 46, 0.95) !important; /* Increased opacity, matches dark theme */
  border: 2px dashed rgba(255, 255, 255, 0.25) !important;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important; /* Added subtle shadow */
  backdrop-filter: blur(10px) !important; /* Blur effect for background */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.card-add:hover {
  background: rgba(45, 36, 56, 0.98) !important; /* Even more opaque on hover */
  border-color: rgba(255, 255, 255, 0.5) !important;
  border-style: solid !important; /* Change from dashed to solid on hover */
  color: #fff;
  transform: scale(1.05) !important; /* Slightly bigger scale */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important; /* Stronger shadow on hover */
}

.add-icon {
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05); /* Subtle background circle */
  border-radius: 50%;
  transition: all 0.3s ease;
}

.card-add:hover .add-icon {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg); /* Rotate + icon on hover */
}

.add-label {
  font-size: 12px;
  font-weight: 600; /* Bolder */
  text-transform: uppercase;
  letter-spacing: 1px; /* More letter spacing */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); /* Text shadow for readability */
  transition: all 0.3s ease;
}

.card-add:hover .add-label {
  letter-spacing: 1.5px; /* Expand on hover */
}

          /* --- DECEASED (HARRY POTTER) STYLE --- */
          .card-profile.card-deceased {
            background: #1a1a1a; /* Very dark grey */
            border-color: #444;
            filter: grayscale(100%) brightness(0.9);
            transition: all 0.5s ease;
          }
          .card-profile.card-deceased .card-name {
            font-family: serif; /* Magic vibe */
            letter-spacing: 0.5px;
            color: #ccc;
          }
          
          /* Lumos Effect */
          .card-profile.card-deceased:hover {
            filter: grayscale(0%) brightness(1.1);
            background: #252525;
            box-shadow: 0 0 20px rgba(167, 139, 250, 0.4); /* Purple glow */
            border-color: #a78bfa;
            z-index: 10;
          }

          /* Ribbon */
          .ribbon {
            position: absolute;
            top: -8px;
            right: 12px;
            background: #000;
            color: #999;
            padding: 2px 8px;
            font-size: 9px;
            font-weight: 700;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: 1px solid #333;
            z-index: 5;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          }
          
  /* --- LIBRARY'S DEFAULT ADD RELATIVE BUTTONS --- */
.card.card-new-rel {
  background: rgba(30, 27, 46, 0.95) !important; /* Increased opacity, matches dark theme */
  border: 2px dashed rgba(255, 255, 255, 0.25) !important;
  border-radius: 16px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important; /* Added subtle shadow */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  backdrop-filter: blur(10px) !important; /* Blur effect for background */
}

.card.card-new-rel:hover {
  background: rgba(45, 36, 56, 0.98) !important; /* Even more opaque on hover */
  border-color: rgba(255, 255, 255, 0.5) !important;
  border-style: solid !important; /* Change from dashed to solid on hover */
  transform: translate(-50%, -50%) scale(1.05) !important; /* Slightly bigger scale */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important; /* Stronger shadow on hover */
}

.card.card-new-rel .card-inner {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 10px !important; /* Slightly more spacing */
}

/* The + icon container */
.card.card-new-rel .person-icon {
  width: 44px !important;
  height: 44px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: rgba(255, 255, 255, 0.05) !important; /* Subtle background circle */
  border-radius: 50% !important;
  transition: all 0.3s ease !important;
}

.card.card-new-rel:hover .person-icon {
  background: rgba(255, 255, 255, 0.1) !important;
  transform: rotate(90deg) !important; /* Rotate + icon on hover */
}

.card.card-new-rel .person-icon svg {
  width: 28px !important;
  height: 28px !important;
  color: rgba(255, 255, 255, 0.7) !important; /* Slightly more visible */
  transition: all 0.3s ease !important;
}

.card.card-new-rel:hover .person-icon svg {
  color: #fff !important;
}

/* The label text */
.card.card-new-rel .card-label {
  color: rgba(255, 255, 255, 0.7) !important; /* More visible */
  font-size: 12px !important;
  font-weight: 600 !important; /* Bolder */
  text-transform: uppercase !important;
  letter-spacing: 1px !important; /* More letter spacing */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important; /* Text shadow for readability */
}

.card.card-new-rel:hover .card-label {
  color: #fff !important;
  letter-spacing: 1.5px !important; /* Expand on hover */
}

/* Gender-specific colors with glows */
.card.card-new-rel.card-male .person-icon {
  background: rgba(96, 165, 250, 0.08) !important;
}

.card.card-new-rel.card-male .person-icon svg {
  color: #60a5fa !important;
}

.card.card-new-rel.card-male:hover {
  border-color: #60a5fa !important;
  box-shadow: 0 4px 16px rgba(96, 165, 250, 0.3) !important; /* Blue glow */
}

.card.card-new-rel.card-male:hover .person-icon {
  background: rgba(96, 165, 250, 0.15) !important;
}

.card.card-new-rel.card-male:hover .person-icon svg {
  color: #93c5fd !important;
}

.card.card-new-rel.card-female .person-icon {
  background: rgba(244, 114, 182, 0.08) !important;
}

.card.card-new-rel.card-female .person-icon svg {
  color: #f472b6 !important;
}

.card.card-new-rel.card-female:hover {
  border-color: #f472b6 !important;
  box-shadow: 0 4px 16px rgba(244, 114, 182, 0.3) !important; /* Pink glow */
}

.card.card-new-rel.card-female:hover .person-icon {
  background: rgba(244, 114, 182, 0.15) !important;
}

.card.card-new-rel.card-female:hover .person-icon svg {
  color: #f9a8d4 !important;
}

/* Specific rel-type styling */
.card.card-new-rel [data-rel-type="son"] {
  color: #60a5fa !important;
}

.card.card-new-rel [data-rel-type="daughter"] {
  color: #f472b6 !important;
}

.card.card-new-rel [data-rel-type="spouse"] {
  color: rgba(216, 180, 254, 0.9) !important; /* Purple for spouse */
}

.card.card-new-rel:hover [data-rel-type="son"],
.card.card-new-rel:hover [data-rel-type="daughter"],
.card.card-new-rel:hover [data-rel-type="spouse"] {
  color: #fff !important;
}

/* Remove any default card styling that might interfere */
.card.card-new-rel .card-inner.card-image-circle {
  border-radius: 0 !important;
}
        `}</style>

        <div
          className="f3 f3-cont"
          id="FamilyChart"
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: bgColor,
          }}
        />
      </>
    );
  }
);

FamilyTreeChart.displayName = "FamilyTreeChart";