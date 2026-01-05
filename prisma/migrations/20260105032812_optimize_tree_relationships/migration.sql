-- CreateIndex
CREATE INDEX "family_relationships_person1_id_idx" ON "family_relationships"("person1_id");

-- CreateIndex
CREATE INDEX "family_relationships_person2_id_idx" ON "family_relationships"("person2_id");

-- CreateIndex
CREATE INDEX "family_tree_nodes_family_id_created_at_idx" ON "family_tree_nodes"("family_id", "created_at");
