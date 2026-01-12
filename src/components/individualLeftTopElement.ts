import { html, svg } from "lit";
import { individualSecondarySpan } from "./spans/individualSecondarySpan";
import { NewDur, TemplatesObj } from "../type";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { computeIndividualFlowRate } from "../utils/computeFlowRate";
import { showLine } from "../utils/showLine";
import { IndividualObject } from "../states/raw/individual/getIndividualObject";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { styleLine } from "../utils/styleLine";
import { checkShouldShowDots } from "../utils/checkShouldShowDots";
import { displayValue } from "../utils/displayValue";

interface TopIndividual {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  individualObj?: IndividualObject;
  displayState: string;
}

export const individualLeftTopElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { individualObj, templatesObj, displayState, newDur }: TopIndividual
) => {
  if (!individualObj) return html`<div class="spacer"></div>`;
  const indexOfIndividual = config?.entities?.individual?.findIndex((e) => e.entity === individualObj.entity) || 0;
  const duration = newDur.individual[indexOfIndividual] || 0;
  return html`<div class="circle-container individual-top">
    <span class="label">${individualObj.name}</span>
    <div
      class="circle"
      @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
        main.openDetails(e, individualObj?.field?.tap_action, individualObj?.entity);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, individualObj?.field?.tap_action, individualObj?.entity);
        }
      }}
    >
      ${individualSecondarySpan(main.hass, main, config, templatesObj, individualObj, indexOfIndividual, "left-top")}
      ${individualObj.icon !== " " ? html` <ha-icon id="individual-left-top-icon" .icon=${individualObj.icon} />` : null}
      ${individualObj?.field?.display_zero_state !== false || (individualObj.state || 0) > (individualObj.displayZeroTolerance ?? 0)
        ? html` <span class="individual-top individual-left-top">
            ${individualObj?.showDirection
              ? html`<ha-icon class="small" .icon=${individualObj.invertAnimation ? "mdi:arrow-down" : "mdi:arrow-up"}></ha-icon>`
              : ""}${displayState}
          </span>`
        : ""}
    </div>
    ${showLine(config, individualObj.state || 0) && !config.entities.home?.hide
      ? html`
          <svg width="80" height="30">
            <path d="M40 -10 v50" id="individual-top" class="${styleLine(individualObj.state || 0, config)}" />
            ${checkShouldShowDots(config) && individualObj.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
              ? svg`<circle
          r="1.75"
          class="individual-top"
          vector-effect="non-scaling-stroke"
        >
          <animateMotion
            dur="${computeIndividualFlowRate(individualObj?.field?.calculate_flow_rate, duration)}s"
            repeatCount="indefinite"
            calcMode="linear"
            keyPoints=${individualObj.invertAnimation ? "0;1" : "1;0"}
            keyTimes="0;1"
          >
            <mpath xlink:href="#individual-top" />
          </animateMotion>
        </circle>`
              : ""}
          </svg>
        `
      : ""}
    ${individualObj.downstream && individualObj.downstream.length
      ? html`<div class="downstream-list">
          ${individualObj.downstream.map((down) => {
            const downstreamDisplay =
              down.state !== null && down.state !== undefined
                ? displayValue(main.hass, config, down.state as any, {
                    unit: down.unit,
                    unitWhiteSpace: down.unit_white_space,
                    decimals: down.decimals,
                    watt_threshold: config.watt_threshold,
                  })
                : "";
            const power = typeof down.state === "number" ? down.state : 0;
            const icon =
              (main.hass.states[down.entity]?.attributes?.icon as string | undefined) || individualObj.icon || "mdi:flash";
            return html`<div class="downstream-item">
              <span class="label downstream-label">${down.name}</span>
              <div
                class="circle downstream-circle"
                @click=${(e: { stopPropagation: () => void; target: HTMLElement }) => {
                  main.openDetails(e, undefined, down.entity);
                }}
              >
                ${icon ? html`<ha-icon .icon=${icon}></ha-icon>` : null}
                ${downstreamDisplay ? html`<span class="downstream-value">${downstreamDisplay}</span>` : ""}
              </div>
              ${showLine(config, power) && !config.entities.home?.hide
                ? html`<svg width="80" height="30">
                    <path d="M40 40 v-40" class="${styleLine(power, config)} downstream-line" />
                  </svg>`
                : ""}
            </div>`;
          })}
        </div>`
      : ""}
  </div>`;
};
