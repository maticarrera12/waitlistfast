#!/bin/bash

# Script para configurar /etc/hosts para desarrollo local con subdominios
# Uso: sudo ./scripts/setup-hosts.sh

HOSTS_FILE="/etc/hosts"
DOMAIN="waitlistfast.com"

echo "Configurando /etc/hosts para desarrollo local..."

# Verificar si ya existe la entrada
if grep -q "$DOMAIN" "$HOSTS_FILE"; then
    echo "⚠️  Ya existe una entrada para $DOMAIN en /etc/hosts"
    echo "   Si quieres reconfigurarla, edita /etc/hosts manualmente"
    exit 0
fi

# Agregar entrada para el dominio principal
echo "127.0.0.1 $DOMAIN" >> "$HOSTS_FILE"
echo "✅ Agregado: 127.0.0.1 $DOMAIN"

echo ""
echo "⚠️  IMPORTANTE: /etc/hosts no soporta wildcards (*)"
echo "   Necesitarás agregar cada subdominio manualmente cuando lo uses."
echo "   Ejemplo: 127.0.0.1 adobe.$DOMAIN"
echo ""
echo "💡 RECOMENDACIÓN: Usa 'localhost' en desarrollo (ya configurado)"
echo "   Los subdominios *.localhost funcionan automáticamente en macOS"
echo ""
echo "✅ Configuración completada!"

