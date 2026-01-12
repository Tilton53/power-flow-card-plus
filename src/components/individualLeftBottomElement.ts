import { html, svg } from "lit";
import { PowerFlowCardPlus } from "../power-flow-card-plus";
import { PowerFlowCardPlusConfig } from "../power-flow-card-plus-config";
import { IndividualObject } from "../states/raw/individual/getIndividualObject";
import { NewDur, TemplatesObj } from "../type";
import { checkShouldShowDots } from "../utils/checkShouldShowDots";
import { computeIndividualFlowRate } from "../utils/computeFlowRate";
import { showLine } from "../utils/showLine";
import { styleLine } from "../utils/styleLine";
import { individualSecondarySpan } from "./spans/individualSecondarySpan";
import { displayValue } from "../utils/displayValue";

interface IndividualBottom {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  individualObj?: IndividualObject;
  displayState: string;
}

export const individualLeftBottomElement = (
  main: PowerFlowCardPlus,
  config: PowerFlowCardPlusConfig,
  { individualObj, templatesObj, displayState, newDur }: IndividualBottom
) => {
  if (!individualObj) return html`<div class="spacer"></div>`;
  const indexOfIndividual = config?.entities?.individual?.findIndex((e) => e.entity === individualObj.entity) || 0;
  const duration = newDur.individual[indexOfIndividual] || 0;
  return html`<div class="circle-container individual-bottom bottom">
    ${showLine(config, individualObj?.state || 0) && !config.entities.home?.hide
      ? html`
          <svg width="80" height="30">
            <path d="M40 40 v-40" id="individual-bottom" class="${styleLine(individualObj?.state || 0, config)}" />
            ${checkShouldShowDots(config) && individualObj?.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
              ? svg`<circle
                                r="1.75"
                                class="individual-bottom"
                                vector-effect="non-scaling-stroke"
                              >
                                <animateMotion
                                  dur="${computeIndividualFlowRate(individualObj.field?.calculate_flow_rate !== false, duration)}s"
                                  repeatCount="indefinite"
                                  calcMode="linear"
                                  keyPoints=${individualObj.invertAnimation ? "0;1" : "1;0"}
                                  keyTimes="0;1"
                                >
                                  <mpath xlink:href="#individual-bottom" />
                                </animateMotion>
                              </circle>`
              : ""}
          </svg>
        `
      : html` <svg width="80" height="30"></svg> `}
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
      ${individualSecondarySpan(main.hass, main, config, templatesObj, individualObj, indexOfIndividual, "left-bottom")}
      ${individualObj?.icon !== " " ? html` <ha-icon id="individual-left-bottom-icon" .icon=${individualObj?.icon} />` : null}
      ${individualObj?.field?.display_zero_state !== false || (individualObj?.state || 0) > (individualObj.displayZeroTolerance ?? 0)
        ? html` <span class="individual-bottom individual-left-bottom"
            >${individualObj?.showDirection
              ? html`<ha-icon class="small" .icon=${individualObj?.invertAnimation ? "mdi:arrow-up" : "mdi:arrow-down"}></ha-icon>`
              : ""}${displayState}
          </span>`
        : ""}
    </div>
    <span class="label">${individualObj?.name}</span>

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
  </div> `;
};
