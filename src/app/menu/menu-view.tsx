"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  Loader2,
  Leaf,
  Flame,
  WheatOff,
} from "lucide-react";
import { DishCategoryLabels, DishTagLabels } from "@/types";

interface MenuViewProps {
  menu: {
    id: string;
    name: string;
    description: string | null;
    dishes: {
      id: string;
      position: number;
      dish: {
        id: string;
        name: string;
        description: string | null;
        category: string;
        price: number;
        calories: number | null;
        tags: { id: string; tag: string }[];
        allergies: {
          id: string;
          allergy: { id: string; name: string };
        }[];
      };
    }[];
  } | null;
  userAllergies: {
    id: string;
    allergy: { id: string; name: string };
    severity: string;
  }[];
  userPreferences: {
    id: string;
    type: string;
  }[];
  existingOrder: {
    id: string;
    status: string;
    items: {
      id: string;
      quantity: number;
      dish: { id: string; name: string };
    }[];
  } | null;
  userId: string;
}

const tagIcons: Record<string, React.ReactNode> = {
  VEGETARIAN: <Leaf className="h-3 w-3" />,
  VEGAN: <Leaf className="h-3 w-3" />,
  SPICY: <Flame className="h-3 w-3" />,
  GLUTEN_FREE: <WheatOff className="h-3 w-3" />,
};

export function MenuView({
  menu,
  userAllergies,
  existingOrder,
}: MenuViewProps) {
  const router = useRouter();
  const [selectedDishes, setSelectedDishes] = useState<string[]>(
    existingOrder?.items.map((item) => item.dish.id) || []
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userAllergyIds = userAllergies.map((ua) => ua.allergy.id);

  const handleToggleDish = (dishId: string) => {
    setSelectedDishes((prev) =>
      prev.includes(dishId)
        ? prev.filter((id) => id !== dishId)
        : [...prev, dishId]
    );
  };

  const isDishDangerous = (dish: MenuViewProps["menu"]["dishes"][0]["dish"]) => {
    return dish.allergies.some((a) => userAllergyIds.includes(a.allergy.id));
  };

  const handleSubmitOrder = async () => {
    if (selectedDishes.length === 0) {
      toast.error("Selecciona al menos un plato");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: existingOrder ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: existingOrder?.id,
          menuId: menu?.id,
          dishIds: selectedDishes,
          notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al realizar pedido");
      }

      toast.success(
        existingOrder ? "Pedido actualizado correctamente" : "Pedido realizado correctamente"
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al realizar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!menu) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <UtensilsCrossed className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No hay menú disponible</h2>
        <p className="text-muted-foreground max-w-md">
          El menú de hoy aún no ha sido publicado. Vuelve más tarde o contacta con
          el administrador para más información.
        </p>
      </div>
    );
  }

  // Group dishes by category
  const dishesByCategory = menu.dishes.reduce(
    (acc, menuDish) => {
      const category = menuDish.dish.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(menuDish);
      return acc;
    },
    {} as Record<string, typeof menu.dishes>
  );

  const categoryOrder = ["STARTER", "MAIN", "SIDE", "DESSERT", "DRINK"];

  return (
    <div className="space-y-6">
      {/* Menu info */}
      <div>
        <h2 className="text-2xl font-bold">{menu.name}</h2>
        {menu.description && (
          <p className="text-muted-foreground mt-1">{menu.description}</p>
        )}
      </div>

      {/* Allergy warning */}
      {userAllergies.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-600">Aviso de alergias</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            Los platos que contienen tus alérgenos registrados ({userAllergies.map((a) => a.allergy.name).join(", ")})
            estarán marcados con un borde rojo.
          </AlertDescription>
        </Alert>
      )}

      {/* Existing order notice */}
      {existingOrder && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Ya tienes un pedido</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Puedes modificar tu pedido actual. Los cambios se guardarán automáticamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Dishes by category */}
      <div className="space-y-8">
        {categoryOrder.map((category) => {
          const dishes = dishesByCategory[category];
          if (!dishes || dishes.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4">
                {DishCategoryLabels[category] || category}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {dishes.map((menuDish) => {
                  const isDangerous = isDishDangerous(menuDish.dish);
                  const isSelected = selectedDishes.includes(menuDish.dish.id);

                  return (
                    <Card
                      key={menuDish.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-primary"
                          : isDangerous
                            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
                            : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleToggleDish(menuDish.dish.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleDish(menuDish.dish.id)}
                              className="mt-1"
                            />
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {menuDish.dish.name}
                                {isDangerous && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                              </CardTitle>
                              {menuDish.dish.description && (
                                <CardDescription className="mt-1">
                                  {menuDish.dish.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          {menuDish.dish.price > 0 && (
                            <span className="font-semibold">
                              {menuDish.dish.price.toFixed(2)}€
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          {menuDish.dish.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {tagIcons[tag.tag]}
                              {DishTagLabels[tag.tag] || tag.tag}
                            </Badge>
                          ))}
                          {menuDish.dish.calories && (
                            <Badge variant="outline">
                              {menuDish.dish.calories} kcal
                            </Badge>
                          )}
                        </div>
                        {isDangerous && (
                          <p className="text-sm text-red-600 mt-2">
                            Contiene: {menuDish.dish.allergies.map((a) => a.allergy.name).join(", ")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Order summary and submit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Tu pedido
          </CardTitle>
          <CardDescription>
            {selectedDishes.length === 0
              ? "Selecciona los platos que quieres pedir"
              : `${selectedDishes.length} plato(s) seleccionado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDishes.length > 0 && (
            <div className="space-y-2">
              {selectedDishes.map((dishId) => {
                const menuDish = menu.dishes.find((d) => d.dish.id === dishId);
                if (!menuDish) return null;
                return (
                  <div
                    key={dishId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{menuDish.dish.name}</span>
                    {menuDish.dish.price > 0 && (
                      <span>{menuDish.dish.price.toFixed(2)}€</span>
                    )}
                  </div>
                );
              })}
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>
                  {menu.dishes
                    .filter((d) => selectedDishes.includes(d.dish.id))
                    .reduce((sum, d) => sum + d.dish.price, 0)
                    .toFixed(2)}
                  €
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Notas o instrucciones especiales
            </label>
            <Textarea
              placeholder="Ej: Sin sal, bien hecho, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmitOrder}
            disabled={selectedDishes.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : existingOrder ? (
              "Actualizar pedido"
            ) : (
              "Confirmar pedido"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
