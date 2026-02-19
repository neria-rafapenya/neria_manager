// src/adapters/ui/react/chat/CarCard.tsx
import { useState, type FC } from "react";

export interface CarProduct {
  id: string;
  name?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  price?: number | string | null;
  mileage?: number | null;
  category?: string | null;
  categorySlug?: string | null;
  fuelType?: string | null;
  gearbox?: string | null;
  seats?: number | null;
  doors?: number | null;
  color?: string | null;
  description?: string | null;
  mainImage?: string | null;
  productLink?: string | null;
}

interface CarCardProps {
  product: CarProduct;
}

// Opcional: si tienes una imagen de placeholder en assets, pon aquí la ruta
// const FALLBACK_IMAGE = "/images/car-placeholder.png";

export const CarCard: FC<CarCardProps> = ({ product }) => {
  const {
    brand,
    model,
    year,
    price,
    mileage,
    category,
    fuelType,
    seats,
    doors,
    color,
    description,
    mainImage,
    productLink,
  } = product;

  const [hasImageError, setHasImageError] = useState(false);

  const fullName = [brand, model, year].filter(Boolean).join(" ");

  const priceNumber =
    typeof price === "number" ? price : price ? parseFloat(String(price)) : NaN;

  const formattedPrice =
    !Number.isNaN(priceNumber) && priceNumber > 0
      ? priceNumber.toLocaleString("es-ES", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 2,
        })
      : null;

  const formattedMileage =
    typeof mileage === "number" && mileage > 0
      ? `${mileage.toLocaleString("es-ES")} km`
      : null;

  const shouldShowFallback = !mainImage || hasImageError;

  return (
    <div className="iachat-car-card">
      <p className="iachat-car-card-intro">
        Aquí tienes una opción de {brand ?? "este modelo"}{" "}
        {year ? `de ${year} ` : ""}
        que podría interesarte.
      </p>

      <div className="row">
        <div className="col-12">
          {/* Imagen principal si existe y no ha fallado */}
          {mainImage && !hasImageError && (
            <img
              src={mainImage}
              alt={fullName || "Coche del catálogo"}
              className="iachat-car-card-image"
              loading="lazy"
              onError={() => {
                // Si hay error de carga, activamos el fallback
                setHasImageError(true);
              }}
            />
          )}

          {/* Fallback si no hay mainImage o si ha fallado */}
          {shouldShowFallback && (
            // Si quieres usar una imagen real de placeholder, descomenta esto:
            // <img
            //   src={FALLBACK_IMAGE}
            //   alt="Imagen no disponible"
            //   className="iachat-car-card-image"
            //   loading="lazy"
            // />
            <div className="iachat-car-card-image iachat-car-card-image--fallback">
              <span>Imagen no disponible</span>
            </div>
          )}
        </div>

        <div className="col-12">
          {fullName && <h3 className="iachat-car-card-title">{fullName}</h3>}

          <ul className="iachat-car-card-list ">
            {formattedPrice && (
              <li>
                <strong>Precio:</strong> {formattedPrice}
              </li>
            )}
            {fuelType && (
              <li>
                <strong>Tipo de combustible:</strong> {fuelType}
              </li>
            )}
            {formattedMileage && (
              <li>
                <strong>Kilometraje:</strong> {formattedMileage}
              </li>
            )}
            {category && (
              <li>
                <strong>Categoría:</strong> {category}
              </li>
            )}
            {typeof seats === "number" && seats > 0 && (
              <li>
                <strong>Asientos:</strong> {seats}
              </li>
            )}
            {typeof doors === "number" && doors > 0 && (
              <li>
                <strong>Puertas:</strong> {doors}
              </li>
            )}
            {color && (
              <li>
                <strong>Color:</strong> {color}
              </li>
            )}
            {description && (
              <li>
                <strong>Descripción:</strong> {description}
              </li>
            )}
          </ul>

          {productLink && (
            <div className="iachat-link-container">
              <a
                href={productLink}
                target="_blank"
                rel="noopener noreferrer"
                className="iachat-car-card-link"
              >
                <span className="iachat-car-card-link-icon">✓</span>
                <span>Ficha del vehículo</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
