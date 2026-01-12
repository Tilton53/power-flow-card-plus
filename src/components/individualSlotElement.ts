import { html, svg, TemplateResult } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { IndividualObject } from "../states/raw/individual/getIndividualObject";
import { NewDur, TemplatesObj } from "../type";
import { individualSecondarySpan } from "./spans/individualSecondarySpan";
import { showLine } from "../utils/showLine";
import { styleLine } from "../utils/styleLine";
import { checkShouldShowDots } from "../utils/checkShouldShowDots";
import { computeIndividualFlowRate } from "../utils/computeFlowRate";
import { displayValue } from "../utils/displayValue";

export type IndividualRow = "top" | "bottom";

export interface IndividualSlotProps {
  individualObj: IndividualObject;
  displayState: string;
  newDur: NewDur;
  templatesObj: TemplatesObj;
  row: IndividualRow;
  index: number; // 0..4 within its row
}

/**
 * Generic individual slot renderer for up to 5 positions per row.
 *
 * Each slot:
 *  - Renders the main individual circle with state/secondary info
 *  - Renders a short vertical stub toward the main cluster (the "bus")
 *  - Renders up to two downstream devices stacked above (top row) or below
 *    (bottom row), with flows linking individual → downstream1 → downstream2.
 */
export const individualSlotElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { individualObj, displayState, newDur, templatesObj, row, index }: IndividualSlotProps
): TemplateResult => {
  const indexOfIndividual = config?.entities?.individual?.findIndex((e) => e.entity === individualObj.entity) ?? -1;
  if (indexOfIndividual === -1) {
    return html``;
  }

  const duration = newDur.individual[indexOfIndividual] || 1.66;
  const slotIdBase = `individual-${row}-slot-${index}`;

  const downstream = (individualObj.downstream || []).slice(0, 2);
  const [down0, down1] = downstream;

  const renderDownstreamValue = (down?: (typeof downstream)[number]) => {
    if (!down || down.state === null || down.state === undefined) return "";
    return displayValue(main.hass, config, down.state as any, {
      unit: down.unit,
      unitWhiteSpace: down.unit_white_space,
      decimals: down.decimals,
      watt_threshold: config.watt_threshold,
    });
  };

  const secondaryKey = row === "top" ? "left-top" : "left-bottom";

  const baseCircle = html`
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        main.openDetails(e, individualObj?.field?.tap_action, individualObj?.entity);
      }}
      @keydown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, individualObj?.field?.tap_action, individualObj?.entity);
        }
      }}
    >
      ${individualSecondarySpan(main.hass, main, config, templatesObj, individualObj, indexOfIndividual, secondaryKey)}
      ${individualObj.icon !== " " ? html`<ha-icon .icon=${individualObj.icon}></ha-icon>` : null}
      ${individualObj?.field?.display_zero_state !== false ||
      (individualObj.state || 0) > (individualObj.displayZeroTolerance ?? 0)
        ? html`<span class="individual-${row}">
            ${individualObj?.showDirection
              ? html`<ha-icon
                  class="small"
                  .icon=${row === "top"
                    ? individualObj.invertAnimation
                      ? "mdi:arrow-down"
                      : "mdi:arrow-up"
                    : individualObj.invertAnimation
                    ? "mdi:arrow-up"
                    : "mdi:arrow-down"}
                ></ha-icon>`
              : ""}
            ${displayState}
          </span>`
        : ""}
    </div>
  `;

  const renderDownstreamBlock = (down: (typeof downstream)[number], layer: 0 | 1): TemplateResult => {
    if (!down) return html``;

    const value = renderDownstreamValue(down);
    const power = typeof down.state === "number" ? down.state : 0;
    const icon =
      (main.hass.states[down.entity]?.attributes?.icon as string | undefined) || individualObj.icon || "mdi:flash";

    const pathId = `${slotIdBase}-down-${layer}`;

    // For top row, downstreams are above the individual; for bottom row they are below.
    const pathD =
      row === "top"
        ? layer === 0
          ? "M40 40 v-40"
          : "M40 80 v-40"
        : layer === 0
        ? "M40 40 v40"
        : "M40 80 v40";

    const arrowForward = row === "bottom"; // visually from main → downstream for bottom, reverse for top
    const keyPoints = arrowForward ? "0;1" : "1;0";

    return html`
      <div class="downstream-item">
        <div
          class="circle downstream-circle"
          @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
            main.openDetails(e, undefined, down.entity);
          }}
        >
          ${icon ? html`<ha-icon .icon=${icon}></ha-icon>` : null}
          ${value ? html`<span class="downstream-value">${value}</span>` : ""}
        </div>
        ${showLine(config, power)
          ? html`<svg width="80" height="40">
              <path
                id=${pathId}
                class="${styleLine(power, config)} downstream-line"
                d=${pathD}
                vector-effect="non-scaling-stroke"
              ></path>
              ${checkShouldShowDots(config) && power >= (individualObj.displayZeroTolerance ?? 0)
                ? svg`<circle
                    r="1.5"
                    class=${row === "top" ? "individual-top" : "individual-bottom"}
                    vector-effect="non-scaling-stroke"
                  >
                    <animateMotion
                      dur="${computeIndividualFlowRate(individualObj.field?.calculate_flow_rate, duration)}s"
                      repeatCount="indefinite"
                      calcMode="linear"
                      keyPoints=${keyPoints}
                      keyTimes="0;1"
                    >
                      <mpath xlink:href="#${pathId}" />
                    </animateMotion>
                  </circle>`
                : ""}
            </svg>`
          : ""}
      </div>
    `;
  };

  // Stub between main bus and individual
  const mainPathId = `${slotIdBase}-main`;
  const mainPower = individualObj.state || 0;
  const mainPathD = row === "top" ? "M40 0 v40" : "M40 40 v40";
  const mainKeyPoints = row === "bottom" ? "0;1" : "1;0";

  const mainStub = html`
    <div class="slot-main-flow">
      <svg width="80" height="40">
        <path
          id=${mainPathId}
          class="${styleLine(mainPower, config)} individual-main-line"
          d=${mainPathD}
          vector-effect="non-scaling-stroke"
        ></path>
        ${showLine(config, mainPower) &&
        checkShouldShowDots(config) &&
        mainPower >= (individualObj.displayZeroTolerance ?? 0)
          ? svg`<circle
              r="1.5"
              class=${row === "top" ? "individual-top" : "individual-bottom"}
              vector-effect="non-scaling-stroke"
            >
              <animateMotion
                dur="${computeIndividualFlowRate(individualObj.field?.calculate_flow_rate, duration)}s"
                repeatCount="indefinite"
                calcMode="linear"
                keyPoints=${mainKeyPoints}
                keyTimes="0;1"
              >
                <mpath xlink:href="#${mainPathId}" />
              </animateMotion>
            </circle>`
          : ""}
      </svg>
    </div>
 `;

  return html`<div class="circle-container individual-slot individual-row-${row} slot-${index}">
    ${row === "top"
      ? html`
          ${baseCircle}
          ${down0 || down1
            ? html`<div class="downstream-list">${renderDownstreamBlock(down0, 0)}${renderDownstreamBlock(down1, 1)}</div>`
            : ""}
          ${mainStub}
        `
      : html`
          ${mainStub}
          ${baseCircle}
          ${down0 || down1
            ? html`<div class="downstream-list">${renderDownstreamBlock(down0, 0)}${renderDownstreamBlock(down1, 1)}</div>`
            : ""}
        `}
  </div>`;
};
