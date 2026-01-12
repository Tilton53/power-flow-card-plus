import { ActionConfig, HomeAssistant } from "custom-card-helpers";
import { IndividualDeviceType } from "@/type";
import { computeFieldIcon, computeFieldName } from "@/utils/computeFieldAttributes";
import { getIndividualSecondaryState, getIndividualState } from ".";
import { hasIndividualObject } from "./hasIndividualObject";
import { getEntityStateWatts } from "@/states/utils/getEntityStateWatts";
import { getEntityState } from "@/states/utils/getEntityState";

const fallbackIndividualObject: IndividualObject = {
  field: undefined,
  entity: "",
  has: false,
  state: null,
  displayZero: false,
  displayZeroTolerance: 0,
  icon: "",
  name: "",
  color: null,
  unit: undefined,
  unit_white_space: false,
  invertAnimation: false,
  showDirection: false,
  secondary: {
    entity: null,
    template: null,
    has: false,
    state: null,
    icon: null,
    unit: null,
    unit_white_space: false,
    displayZero: false,
    accept_negative: false,
    displayZeroTolerance: 0,
    decimals: null,
  },
  downstream: [],
};

export type IndividualObject = {
  field: IndividualDeviceType | undefined;
  entity: string;
  has: boolean;
  state: number | null;
  displayZero: boolean;
  displayZeroTolerance: number;
  icon: string;
  name: string;
  color: any;
  unit?: string;
  unit_white_space: boolean;
  decimals?: number;
  invertAnimation: boolean;
  showDirection: boolean;
  secondary: {
    entity: string | null;
    template: string | null;
    has: boolean;
    state: string | number | null;
    icon: string | null;
    unit: string | null;
    unit_white_space: boolean;
    displayZero: boolean;
    accept_negative: boolean;
    displayZeroTolerance: number;
    decimals: number | null;
    tap_action?: ActionConfig;
  };
  downstream: {
    entity: string;
    name: string;
    state: number | string | null;
    unit?: string;
    unit_white_space: boolean;
    decimals?: number;
  }[];
};

export const getIndividualObject = (hass: HomeAssistant, field: IndividualDeviceType | undefined): IndividualObject => {
  if (!field || !field?.entity) return fallbackIndividualObject;
  const entity = field.entity;
  const state = getIndividualState(hass, field);
  const displayZero = field?.display_zero || false;
  const displayZeroTolerance = field?.display_zero_tolerance || 0;
  const has = hasIndividualObject(displayZero, state, displayZeroTolerance);
  const isStateNegative = state && state < 0;
  const userConfiguredInvertAnimation = field?.inverted_animation || false;
  const invertAnimation = isStateNegative ? !userConfiguredInvertAnimation : userConfiguredInvertAnimation;
  const color = field?.color && typeof field?.color === "string" ? field?.color : null;

  const downstream =
    field.downstream?.map((down) => {
      const entityId = down.entity;
      const watts = getEntityStateWatts(hass, entityId);
      const hasNumeric = watts !== null && !Number.isNaN(watts as number);
      const rawState = hasNumeric ? watts : getEntityState(hass, entityId);
      const entityObj = hass.states[entityId];
      const name = down.name || entityObj?.attributes?.friendly_name || entityId;
      const unit =
        down.unit_of_measurement ||
        (typeof entityObj?.attributes?.unit_of_measurement === "string"
          ? (entityObj.attributes.unit_of_measurement as string)
          : undefined);

      return {
        entity: entityId,
        name,
        state: rawState ?? null,
        unit,
        unit_white_space: down.unit_white_space !== false,
        decimals: down.decimals,
      };
    }) ?? [];

  return {
    field,
    entity,
    has,
    state,
    displayZero,
    displayZeroTolerance,
    icon: computeFieldIcon(hass, field, "mdi:flash"),
    name: computeFieldName(hass, field, "Individual"),
    color,
    unit: field?.unit_of_measurement,
    unit_white_space: field?.unit_white_space !== false,
    decimals: field?.decimals,
    invertAnimation,
    showDirection: field?.show_direction || false,
    secondary: {
      entity: field?.secondary_info?.entity || null,
      template: field?.secondary_info?.template || null,
      has: field?.secondary_info?.entity !== undefined,
      state: getIndividualSecondaryState(hass, field) || null,
      accept_negative: field?.secondary_info?.accept_negative || false,
      icon: field?.secondary_info?.icon || null,
      unit: field?.secondary_info?.unit_of_measurement || null,
      unit_white_space: field?.secondary_info?.unit_white_space !== false,
      displayZero: field?.secondary_info?.display_zero || false,
      displayZeroTolerance: field?.secondary_info?.display_zero_tolerance || 0,
      decimals: field?.secondary_info?.decimals || null,
      tap_action: field?.secondary_info?.tap_action,
    },
    downstream,
  };
};
