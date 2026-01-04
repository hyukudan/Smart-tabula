// Enums para el sistema
export const UserRole = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
} as const;

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export const DishCategory = {
  STARTER: "STARTER",
  MAIN: "MAIN",
  SIDE: "SIDE",
  DESSERT: "DESSERT",
  DRINK: "DRINK",
} as const;

export const MealType = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
} as const;

export const AbsenceReason = {
  VACATION: "VACATION",
  SICK: "SICK",
  REMOTE: "REMOTE",
  OTHER: "OTHER",
} as const;

export const NotificationType = {
  MENU_PUBLISHED: "MENU_PUBLISHED",
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  REMINDER: "REMINDER",
  SYSTEM: "SYSTEM",
} as const;

export const AllergySeverity = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export const DietaryPreference = {
  VEGETARIAN: "VEGETARIAN",
  VEGAN: "VEGAN",
  HALAL: "HALAL",
  KOSHER: "KOSHER",
  LOW_CARB: "LOW_CARB",
  GLUTEN_FREE: "GLUTEN_FREE",
  DAIRY_FREE: "DAIRY_FREE",
  NUT_FREE: "NUT_FREE",
} as const;

export const DishTag = {
  VEGETARIAN: "VEGETARIAN",
  VEGAN: "VEGAN",
  SPICY: "SPICY",
  GLUTEN_FREE: "GLUTEN_FREE",
  DAIRY_FREE: "DAIRY_FREE",
  NUT_FREE: "NUT_FREE",
  LOW_CALORIE: "LOW_CALORIE",
  HIGH_PROTEIN: "HIGH_PROTEIN",
} as const;

// Category labels en español
export const DishCategoryLabels: Record<string, string> = {
  STARTER: "Entrante",
  MAIN: "Principal",
  SIDE: "Acompañamiento",
  DESSERT: "Postre",
  DRINK: "Bebida",
};

export const OrderStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
};

export const AbsenceReasonLabels: Record<string, string> = {
  VACATION: "Vacaciones",
  SICK: "Enfermedad",
  REMOTE: "Teletrabajo",
  OTHER: "Otro",
};

export const DietaryPreferenceLabels: Record<string, string> = {
  VEGETARIAN: "Vegetariano",
  VEGAN: "Vegano",
  HALAL: "Halal",
  KOSHER: "Kosher",
  LOW_CARB: "Bajo en carbohidratos",
  GLUTEN_FREE: "Sin gluten",
  DAIRY_FREE: "Sin lácteos",
  NUT_FREE: "Sin frutos secos",
};

export const DishTagLabels: Record<string, string> = {
  VEGETARIAN: "Vegetariano",
  VEGAN: "Vegano",
  SPICY: "Picante",
  GLUTEN_FREE: "Sin gluten",
  DAIRY_FREE: "Sin lácteos",
  NUT_FREE: "Sin frutos secos",
  LOW_CALORIE: "Bajo en calorías",
  HIGH_PROTEIN: "Alto en proteínas",
};

// Types de TypeScript
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];
export type DishCategoryType = (typeof DishCategory)[keyof typeof DishCategory];
export type MealTypeType = (typeof MealType)[keyof typeof MealType];
export type AbsenceReasonType = (typeof AbsenceReason)[keyof typeof AbsenceReason];
export type NotificationTypeType = (typeof NotificationType)[keyof typeof NotificationType];
export type AllergySeverityType = (typeof AllergySeverity)[keyof typeof AllergySeverity];
export type DietaryPreferenceType = (typeof DietaryPreference)[keyof typeof DietaryPreference];
export type DishTagType = (typeof DishTag)[keyof typeof DishTag];
