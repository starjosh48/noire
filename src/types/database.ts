
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "noire_cart_items": {
                  Row: {
                    "cart_id": string,"created_at": string,"id": string,"product_id": string,"product_variant_id": string,"quantity": number,"updated_at": string
                  }
                  Insert: {
                    "cart_id": string,"created_at"?: string,"id"?: string,"product_id": string,"product_variant_id": string,"quantity": number,"updated_at"?: string
                  }
                  Update: {
                    "cart_id"?: string,"created_at"?: string,"id"?: string,"product_id"?: string,"product_variant_id"?: string,"quantity"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "noire_cart_items_cart_id_fkey"
      columns: ["cart_id"]
isOneToOne: false
      referencedRelation: "noire_carts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "noire_cart_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "noire_products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "noire_cart_items_product_variant_id_fkey"
      columns: ["product_variant_id"]
isOneToOne: false
      referencedRelation: "noire_product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"noire_carts": {
                  Row: {
                    "created_at": string,"id": string,"updated_at": string,"user_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"noire_newsletter_subscribers": {
                  Row: {
                    "created_at": string,"email": string,"id": string,"source": string
                  }
                  Insert: {
                    "created_at"?: string,"email": string,"id"?: string,"source"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"id"?: string,"source"?: string
                  }
                  Relationships: [
                    
                  ]
                },"noire_order_items": {
                  Row: {
                    "created_at": string,"id": string,"image_url": string,"order_id": string,"product_id": string | null,"product_name": string,"product_number": number,"product_slug": string,"product_variant_id": string | null,"quantity": number,"size_ml": number,"sku": string,"total_price": number,"unit_price": number
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"image_url": string,"order_id": string,"product_id"?: string | null,"product_name": string,"product_number": number,"product_slug": string,"product_variant_id"?: string | null,"quantity": number,"size_ml": number,"sku": string,"total_price": number,"unit_price": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"image_url"?: string,"order_id"?: string,"product_id"?: string | null,"product_name"?: string,"product_number"?: number,"product_slug"?: string,"product_variant_id"?: string | null,"quantity"?: number,"size_ml"?: number,"sku"?: string,"total_price"?: number,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "noire_order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "noire_orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "noire_order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "noire_products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "noire_order_items_product_variant_id_fkey"
      columns: ["product_variant_id"]
isOneToOne: false
      referencedRelation: "noire_product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"noire_orders": {
                  Row: {
                    "access_token": string,"cart_id": string | null,"city": string,"confirmation_email_sent_at": string | null,"country": string,"created_at": string,"currency": string,"customer_email": string,"customer_name": string,"customer_phone": string,"delivery_notes": string | null,"id": string,"idempotency_key": string,"order_number": string,"paid_at": string | null,"payment_method": string,"payment_reference": string | null,"payment_status": Database["public"]['Enums']["noire_payment_status"],"postal_code": string | null,"shipping_address": string,"shipping_fee": number,"state": string,"status": Database["public"]['Enums']["noire_order_status"],"subtotal": number,"total": number,"updated_at": string,"user_id": string | null
                  }
                  Insert: {
                    "access_token"?: string,"cart_id"?: string | null,"city": string,"confirmation_email_sent_at"?: string | null,"country": string,"created_at"?: string,"currency"?: string,"customer_email": string,"customer_name": string,"customer_phone": string,"delivery_notes"?: string | null,"id"?: string,"idempotency_key": string,"order_number": string,"paid_at"?: string | null,"payment_method"?: string,"payment_reference"?: string | null,"payment_status"?: Database["public"]['Enums']["noire_payment_status"],"postal_code"?: string | null,"shipping_address": string,"shipping_fee": number,"state": string,"status"?: Database["public"]['Enums']["noire_order_status"],"subtotal": number,"total": number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "access_token"?: string,"cart_id"?: string | null,"city"?: string,"confirmation_email_sent_at"?: string | null,"country"?: string,"created_at"?: string,"currency"?: string,"customer_email"?: string,"customer_name"?: string,"customer_phone"?: string,"delivery_notes"?: string | null,"id"?: string,"idempotency_key"?: string,"order_number"?: string,"paid_at"?: string | null,"payment_method"?: string,"payment_reference"?: string | null,"payment_status"?: Database["public"]['Enums']["noire_payment_status"],"postal_code"?: string | null,"shipping_address"?: string,"shipping_fee"?: number,"state"?: string,"status"?: Database["public"]['Enums']["noire_order_status"],"subtotal"?: number,"total"?: number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "noire_orders_cart_id_fkey"
      columns: ["cart_id"]
isOneToOne: false
      referencedRelation: "noire_carts"
      referencedColumns: ["id"]
    }
                  ]
                },"noire_product_variants": {
                  Row: {
                    "created_at": string,"id": string,"price": number,"product_id": string,"size_ml": number,"sku": string,"stock_quantity": number,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"price": number,"product_id": string,"size_ml": number,"sku": string,"stock_quantity"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"price"?: number,"product_id"?: string,"size_ml"?: number,"sku"?: string,"stock_quantity"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "noire_product_variants_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "noire_products"
      referencedColumns: ["id"]
    }
                  ]
                },"noire_products": {
                  Row: {
                    "accent_color": string,"base_notes": (string)[],"bestseller": boolean,"category": string,"created_at": string,"currency": string,"description": string,"featured": boolean,"fragrance_family": string,"gallery_images": (string)[],"gender": Database["public"]['Enums']["noire_product_gender"],"heart_notes": (string)[],"id": string,"image_url": string,"is_active": boolean,"longevity": string | null,"moods": (string)[],"name": string,"new_arrival": boolean,"number": number,"price": number,"sales_count": number,"scent_profiles": (string)[],"search_vector": unknown,"secondary_family": string | null,"short_description": string,"sillage": string | null,"slug": string,"sort_order": number,"stock_quantity": number,"top_notes": (string)[],"updated_at": string
                  }
                  Insert: {
                    "accent_color"?: string,"base_notes"?: (string)[],"bestseller"?: boolean,"category"?: string,"created_at"?: string,"currency"?: string,"description": string,"featured"?: boolean,"fragrance_family": string,"gallery_images"?: (string)[],"gender"?: Database["public"]['Enums']["noire_product_gender"],"heart_notes"?: (string)[],"id"?: string,"image_url": string,"is_active"?: boolean,"longevity"?: string | null,"moods"?: (string)[],"name": string,"new_arrival"?: boolean,"number": number,"price"?: number,"sales_count"?: number,"scent_profiles"?: (string)[],"search_vector"?: unknown,"secondary_family"?: string | null,"short_description": string,"sillage"?: string | null,"slug": string,"sort_order"?: number,"stock_quantity"?: number,"top_notes"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "accent_color"?: string,"base_notes"?: (string)[],"bestseller"?: boolean,"category"?: string,"created_at"?: string,"currency"?: string,"description"?: string,"featured"?: boolean,"fragrance_family"?: string,"gallery_images"?: (string)[],"gender"?: Database["public"]['Enums']["noire_product_gender"],"heart_notes"?: (string)[],"id"?: string,"image_url"?: string,"is_active"?: boolean,"longevity"?: string | null,"moods"?: (string)[],"name"?: string,"new_arrival"?: boolean,"number"?: number,"price"?: number,"sales_count"?: number,"scent_profiles"?: (string)[],"search_vector"?: unknown,"secondary_family"?: string | null,"short_description"?: string,"sillage"?: string | null,"slug"?: string,"sort_order"?: number,"stock_quantity"?: number,"top_notes"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"noire_profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"email": string,"full_name": string | null,"id": string,"phone": string | null,"updated_at": string
                  }
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"email": string,"full_name"?: string | null,"id": string,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"noire_wishlist_items": {
                  Row: {
                    "created_at": string,"id": string,"product_id": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"product_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"product_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "noire_wishlist_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "noire_products"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "noire_cancel_stale_unpaid_orders":
{ Args: { "p_older_than"?: string }; Returns: number
                           },
"noire_cancel_unpaid_order":
{ Args: { "p_order_id": string }; Returns: boolean
                           },
"noire_confirm_payment":
{ Args: { "p_amount_minor": number,"p_currency": string,"p_order_id": string,"p_reference": string }; Returns: Json
                           },
"noire_place_order":
{ Args: { "p_cart_id": string,"p_clear_cart"?: boolean,"p_currency": string,"p_customer": Json,"p_free_shipping_threshold": number,"p_idempotency_key": string,"p_payment_method": string,"p_shipping_fee": number,"p_status"?: Database["public"]['Enums']["noire_order_status"],"p_user_id": string }; Returns: Json
                           },
"noire_search_products":
{ Args: { "search_query": string }; Returns: {
              "accent_color": string,
"base_notes": (string)[],
"bestseller": boolean,
"category": string,
"created_at": string,
"currency": string,
"description": string,
"featured": boolean,
"fragrance_family": string,
"gallery_images": (string)[],
"gender": Database["public"]['Enums']["noire_product_gender"],
"heart_notes": (string)[],
"id": string,
"image_url": string,
"is_active": boolean,
"longevity": string | null,
"moods": (string)[],
"name": string,
"new_arrival": boolean,
"number": number,
"price": number,
"sales_count": number,
"scent_profiles": (string)[],
"search_vector": unknown,
"secondary_family": string | null,
"short_description": string,
"sillage": string | null,
"slug": string,
"sort_order": number,
"stock_quantity": number,
"top_notes": (string)[],
"updated_at": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "noire_products"
        isOneToOne: false
        isSetofReturn: true
      } }
          }
          Enums: {
            "noire_order_status": "pending_payment"|"confirmed"|"processing"|"shipped"|"delivered"|"cancelled","noire_payment_status": "pending"|"paid"|"refunded"|"failed","noire_product_gender": "unisex"|"feminine"|"masculine"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "noire_order_status": ["pending_payment", "confirmed", "processing", "shipped", "delivered", "cancelled"],"noire_payment_status": ["pending", "paid", "refunded", "failed"],"noire_product_gender": ["unisex", "feminine", "masculine"]
          }
        }
} as const
