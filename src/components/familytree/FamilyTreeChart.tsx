/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/familytree/FamilyTreeChart.tsx
import React, {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Theme } from "@mui/material";
import {
  FamilyTreeChartHandle,
  FamilyTreeNode,
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
    const f3ChartInstance = useRef<any>(null);
    const f3EditTreeRef = useRef<any>(null);
    const f3LibRef = useRef<any>(null);
    const activeChartDataRef = useRef<any[]>([]);
    const onNodeSelectRef = useRef(onNodeSelect);
    const onAddRelativeRef = useRef(onAddRelative);

    onNodeSelectRef.current = onNodeSelect;
    onAddRelativeRef.current = onAddRelative;

    // ⭐ Responsive dimensions
    const cardWidth = isMobile ? 70 : 240;
    const cardHeight = isMobile ? 90 : 100;
    const cardXSpacing = isMobile ? 80 : 260;
    const cardYSpacing = isMobile ? 100 : 160;

    const createChart = useCallback(
      (f3: any, dataProps: any[]) => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = "";
        const dataClone = JSON.parse(JSON.stringify(dataProps));
        activeChartDataRef.current = dataClone;

        const f3Chart = f3
          .createChart("#FamilyChart", dataClone)
          .setTransitionTime(800)
          .setCardXSpacing(cardXSpacing)
          .setCardYSpacing(cardYSpacing)
          .setShowSiblingsOfMain(true)
          .setOrientationVertical();

        // Zoom control for mobile
        if (isMobile && f3Chart.zoom) {
          setTimeout(() => {
            try {
              f3Chart.zoom.scaleExtent([0.3, 3]);
              f3Chart.zoom.scaleTo(f3Chart.svg, 0.9);
            } catch (e) {
              console.warn('Zoom control not available');
            }
          }, 100);
        }

        const f3Card = f3Chart
          .setCardHtml()
          .setCardDim({
            width: cardWidth,
            height: cardHeight,
            inner_width: cardWidth,
            inner_height: cardHeight,
          })
          .setMiniTree(true)
          .setStyle("imageCircle")
          .setOnHoverPathToMain();

        // ⭐ CUSTOM HTML CREATOR
        f3Card.setCardInnerHtmlCreator((d: any) => {
          // Handle add buttons
          if (d.data.to_add || d.data._new_rel_data) {
            const label = d.data.label || d.data["first name"] || "Add";
            
            if (isMobile) {
              return `
                <div class="custom-card card-add-mobile">
                  <div class="add-icon-mobile">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                  <div class="add-label-mobile">${label}</div>
                </div>
              `;
            }
            
            return `
              <div class="custom-card card-add">
                <div class="add-icon">
                   <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <div class="add-label">${label}</div>
              </div>
            `;
          }

          // Handle real person cards
          const node = d.data;
          const userData = node.data || {};
          const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`;
          
          const avatar = userData.avatar || userData.photoUrl || defaultAvatar;
          const firstName = userData["first name"] || "Unknown";
          const lastName = userData["last name"] || "";
          const fullName = `${firstName} ${lastName}`;
          
          const formatYearOnly = (dateString: string | undefined) => {
            if (!dateString) return "";
            return new Date(dateString).getFullYear().toString();
          };

          const isDeceased = !!userData.deathDate;
          const genderClass = userData.gender === "M" ? "male" : "female";
          const deceasedClass = isDeceased ? "card-deceased" : "";

          if (isMobile) {
            // Mobile: Circular design
            let displayName = firstName;
            if (firstName.length > 10) {
              displayName = firstName.substring(0, 9) + '...';
            }

            return `
              <div class="custom-card card-circle-wrapper ${genderClass} ${deceasedClass}">
                <div class="card-circle">
                  ${isDeceased ? '<div class="deceased-badge">†</div>' : ''}
                  <img src="${avatar}" class="card-avatar-circle" alt="${fullName}">
                </div>
                <div class="card-name-mobile" title="${fullName}">${displayName}</div>
              </div>
            `;
          }

          // Desktop: Full card
          const birthYear = formatYearOnly(userData.birthday);
          const deathYear = formatYearOnly(userData.deathDate);
          const dateStr = deathYear ? `${birthYear} - ${deathYear}` : birthYear;
          
          const formatDateForDisplay = (dateString: string | undefined) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
          };
          const anniversaryDisplay = userData.weddingAnniversary
            ? formatDateForDisplay(userData.weddingAnniversary)
            : "";

          return `
            <div class="custom-card card-profile ${genderClass} ${deceasedClass}">
              ${isDeceased ? '<div class="ribbon">In Memory</div>' : ''}
              <div class="card-image-wrapper">
                <img src="${avatar}" class="card-avatar" alt="${fullName}"/>
              </div>
              <div class="card-details">
                <div class="card-name" title="${fullName}">${fullName}</div>
                ${dateStr ? `<div class="card-dates">${dateStr}</div>` : ''}
                ${anniversaryDisplay ? `<div class="card-anniversary" title="Wedding Anniversary: ${anniversaryDisplay}">💍 ${new Date(userData.weddingAnniversary).getFullYear()}</div>` : ''}
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

        // ⭐ CLICK HANDLER (Restored from your working version)
        f3Card.setOnCardClick((e: MouseEvent, d: any) => {
          e.stopPropagation();
          const dataAny = d.data as any;

          // Handle ghost nodes
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

          // Handle virtual add nodes
          if (dataAny.to_add) {
            const childId = dataAny.rels?.children?.[0];
            const spouseId = dataAny.rels?.spouses?.[0];
            const name = dataAny["first name"] || dataAny.label || "";

            let role = "father";
            if (name === "Add Mother") role = "mother";
            else if (name === "Add Father") role = "father";
            else if (spouseId) {
              const spouse = activeChartDataRef.current.find((n: any) => n.id === spouseId);
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

          // Handle real person nodes
          const nodeData = activeChartDataRef.current.find((n: any) => n.id === d.data.id);
          if (nodeData) {
            if (onNodeSelectRef.current) {
              onNodeSelectRef.current(nodeData);
            }
            const cardAny = f3Card as any;
            if (cardAny.onCardClickDefault) {
              cardAny.onCardClickDefault(e, d);
            }
          }
        });

        // Ensure cursor styling
        f3Card.setOnCardUpdate(function (this: HTMLElement) {
          this.style.cursor = "pointer";
        });

        f3Chart.updateTree({ initial: true });
        f3ChartInstance.current = f3Chart;
      },
      [isAdmin, isMobile, cardWidth, cardHeight, cardXSpacing, cardYSpacing]
    );

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
        if (target.classList.contains("f3-cont") || target.tagName === "svg") {
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
          const node = activeChartDataRef.current.find((n: any) => n.id === nodeId);
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
        <style jsx global>{`
          .f3-form-cont {
            display: none !important;
          }

          /* Enable pointer events */
          .f3-card-edit, g.f3-card-edit {
            pointer-events: auto !important;
            cursor: pointer !important;
          }

          /* Disable mobile tap highlight */
          .card_cont, .card, .custom-card, .card-circle, .card-avatar-circle {
            -webkit-tap-highlight-color: transparent !important;
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
          }

          /* SVG path highlighting */
          @media (hover: hover) and (pointer: fine) {
            .card-circle:hover,
            .card-profile:hover {
              transform: scale(1.05);
            }
          }

          .f3 .link-hover {
            stroke: #a78bfa !important;
            stroke-width: 3px !important;
            opacity: 1 !important;
          }

          .f3 .link {
            transition: stroke 0.3s ease, stroke-width 0.3s ease;
          }

          /* Card container base */
          .custom-card {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: ${isMobile ? '0' : '16px'};
            padding: ${isMobile ? '0' : '10px'};
            position: relative;
            box-sizing: border-box;
            transition: all 0.2s ease;
          }

          /* ===== MOBILE CIRCULAR DESIGN ===== */
          .card-circle-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            height: 100%;
            padding-top: ${isMobile ? '10px' : '10px'};
            position: relative;
            z-index: 2;  /* Avatar on top */
          }

          /* ⭐ FIX: Mini-tree tucks BEHIND the avatar circle */
          ${isMobile ? `
            .f3 .mini-tree {
              position: absolute !important;
              top: -2px !important;
              left: 50% !important;
              transform: translateX(-50%) scale(0.7) !important;
              z-index: 0 !important;
            }
            .f3 .mini-tree svg {
              width: 50px !important;
              height: 16px !important;
            }
          ` : ''}

          .card-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            overflow: hidden;
            position: relative;
            border: 3px solid rgba(255, 255, 255, 0.2);
            background: #1e1b2e;
            box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
            transition: all 0.2s ease;
            z-index: 2; /* On top of mini-tree */
          }

          .card-circle:active {
            transform: scale(0.92);
          }

          .card-circle-wrapper.male .card-circle {
            border-color: #60a5fa;
            box-shadow: 0 3px 12px rgba(96, 165, 250, 0.4);
          }

          .card-circle-wrapper.female .card-circle {
            border-color: #f472b6;
            box-shadow: 0 3px 12px rgba(244, 114, 182, 0.4);
          }

          .card-circle-wrapper.card-deceased .card-circle {
            filter: grayscale(100%) brightness(0.7);
            border-color: #666;
          }

          .card-avatar-circle {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .deceased-badge {
            position: absolute;
            top: -3px;
            right: -3px;
            background: #000;
            color: #999;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            border: 2px solid #1e1b2e;
            z-index: 10;
          }

          .card-name-mobile {
            text-align: center;
            font-size: 10px;
            font-weight: 600;
            color: #ececec;
            margin-top: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            padding: 0 2px;
          }

          /* --- MOBILE ADD BUTTON (Ghost Style with Z-Index Fix) --- */
          .card-add-mobile {
            flex-direction: column;
            gap: 4px;
            padding-top: 10px;
            position: relative;
            z-index: 2; /* ⭐ Ensure clickable above svg lines */
          }

          .add-icon-mobile {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(30, 27, 46, 0.9);
            border: 2px dashed rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;
            pointer-events: auto;
          }

          .card-add-mobile:active .add-icon-mobile {
            border-style: solid;
            transform: scale(0.92);
            background: rgba(45, 36, 56, 1);
          }

          .add-label-mobile {
            font-size: 10px;
            font-weight: 600;
            color: #ececec;
            margin-top: 6px;
          }

          /* --- DESKTOP PROFILE CARD STYLE (Dark Theme) --- */
          .card-profile {
            background: linear-gradient(145deg, #2d2438, #1e1b2e);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            color: #fff;
            padding: 10px;
          }

          .card-profile:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .card-profile.male .card-image-wrapper {
            border-color: #60a5fa;
            box-shadow: 0 0 10px rgba(96, 165, 250, 0.2);
          }

          .card-profile.female .card-image-wrapper {
            border-color: #f472b6;
            box-shadow: 0 0 10px rgba(244, 114, 182, 0.2);
          }

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
            color: #9ca3af;
            font-family: monospace;
          }

          .card-anniversary {
            font-size: 11px;
            color: #d8b4fe;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          /* --- DESKTOP ADD BUTTON STYLE --- */
          .card-add {
            background: rgba(30, 27, 46, 0.95) !important;
            border: 2px dashed rgba(255, 255, 255, 0.25) !important;
            justify-content: center;
            flex-direction: column;
            gap: 10px;
            color: rgba(255, 255, 255, 0.7);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
            backdrop-filter: blur(10px) !important;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }

          .card-add:hover {
            background: rgba(45, 36, 56, 0.98) !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
            border-style: solid !important;
            color: #fff;
            transform: scale(1.05) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important;
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
            background: rgba(255, 255, 255, 0.05);
            border-radius: 50%;
            transition: all 0.3s ease;
          }

          .card-add:hover .add-icon {
            background: rgba(255, 255, 255, 0.1);
            transform: rotate(90deg);
          }

          .add-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            transition: all 0.3s ease;
          }

          .card-add:hover .add-label {
            letter-spacing: 1.5px;
          }

          /* --- LIBRARY DEFAULT NODE OVERRIDES (RESTORES FANCY CSS FOR DEFAULT NODES) --- */
          /* If the library renders its own .card-inner nodes (ignoring our HTML), we style them here. */
          
          .card-inner {
            background: rgba(30, 27, 46, 0.95) !important; 
            border: 2px dashed rgba(255, 255, 255, 0.25) !important;
            border-radius: 16px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
            backdrop-filter: blur(10px) !important;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            
            /* Center Content */
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 10px !important;
          }

          /* Hover State */
          .card-inner:hover {
            background: rgba(45, 36, 56, 0.98) !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
            border-style: solid !important;
            transform: scale(1.05) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important;
            z-index: 10 !important;
          }

          /* Icon inside default library node */
          .card-inner .person-icon {
            width: 44px !important;
            height: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(255, 255, 255, 0.05) !important;
            border-radius: 50% !important;
            transition: all 0.3s ease !important;
          }

          .card-inner:hover .person-icon {
            background: rgba(255, 255, 255, 0.1) !important;
            transform: rotate(90deg) !important;
          }

          /* Text inside default library node */
          .card-inner .card-label {
            color: rgba(255, 255, 255, 0.7) !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
            transition: all 0.3s ease !important;
          }

          .card-inner:hover .card-label {
            color: #fff !important;
            letter-spacing: 1.5px !important;
          }

          /* --- DECEASED / RIBBON --- */
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

          .card-profile.card-deceased {
            background: #1a1a1a;
            border-color: #444;
            filter: grayscale(100%) brightness(0.9);
            transition: all 0.5s ease;
          }

          .card-profile.card-deceased:hover {
            filter: grayscale(0%) brightness(1.1);
            background: #252525;
            box-shadow: 0 0 20px rgba(167, 139, 250, 0.4);
            border-color: #a78bfa;
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