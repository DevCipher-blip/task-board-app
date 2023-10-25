from decimal import Decimal
from itertools import pairwise
from unittest import mock

from boards.models import POSITION_STEP, Card

from .support import DynamoTestCase


def titles(status):
    return [card["title"] for card in Card.lane(status)]


class CardStorageTests(DynamoTestCase):
    def test_new_cards_are_appended_to_their_lane(self):
        Card.create("First", "", "todo")
        Card.create("Second", None, "todo")
        Card.create("Elsewhere", "", "done")
        self.assertEqual(titles("todo"), ["First", "Second"])
        self.assertEqual(Card.lane("todo")[1]["description"], "")

    def test_get_all_groups_lanes_in_board_order(self):
        Card.create("Shipped", "", "done")
        Card.create("Doing", "", "in-progress")
        Card.create("Next", "", "todo")
        self.assertEqual([card["status"] for card in Card.get_all()], ["todo", "in-progress", "done"])

    def test_get_all_follows_scan_pages(self):
        pages = [
            {"Items": [{"id": "1", "status": "todo", "position": 2}], "LastEvaluatedKey": {"id": "1"}},
            {"Items": [{"id": "2", "status": "todo", "position": 1}]},
        ]
        table = mock.Mock(**{"scan.side_effect": pages})
        with mock.patch("boards.models.card_table", return_value=table):
            self.assertEqual([card["id"] for card in Card.get_all()], ["2", "1"])
        table.scan.assert_called_with(ExclusiveStartKey={"id": "1"})

    def test_reorder_within_a_lane_persists(self):
        for title in ("A", "B", "C"):
            Card.create(title, "", "todo")
        c = Card.lane("todo")[2]
        Card.move(c["id"], "todo", 0)
        self.assertEqual(titles("todo"), ["C", "A", "B"])
        b = Card.lane("todo")[2]
        Card.move(b["id"], "todo", 1)
        self.assertEqual(titles("todo"), ["C", "B", "A"])

    def test_move_to_another_lane_lands_at_the_requested_slot(self):
        for title in ("Todo 1", "Todo 2"):
            Card.create(title, "", "todo")
        for title in ("Done 1", "Done 2"):
            Card.create(title, "", "done")
        moving = Card.lane("todo")[0]
        moved = Card.move(moving["id"], "done", 1)
        self.assertEqual(moved["status"], "done")
        self.assertEqual(titles("done"), ["Done 1", "Todo 1", "Done 2"])
        self.assertEqual(titles("todo"), ["Todo 2"])

    def test_index_past_the_end_appends(self):
        Card.create("A", "", "todo")
        b = Card.create("B", "", "done")
        Card.move(b["id"], "todo", 99)
        self.assertEqual(titles("todo"), ["A", "B"])

    def test_crowded_positions_are_renumbered(self):
        a = Card.create("A", "", "todo")
        b = Card.create("B", "", "todo")
        c = Card.create("C", "", "todo")
        Card.update(b["id"], position=a["position"] + Decimal("0.0000001"))
        Card.move(c["id"], "todo", 1)
        lane = Card.lane("todo")
        self.assertEqual([card["title"] for card in lane], ["A", "C", "B"])
        self.assertTrue(all(later["position"] - earlier["position"] >= 1 for earlier, later in pairwise(lane)))

    def test_moving_a_missing_card_returns_none(self):
        self.assertIsNone(Card.move("missing", "todo", 0))

    def test_update_never_creates_a_missing_card(self):
        self.assertIsNone(Card.update("missing", title="Ghost"))
        self.assertIsNone(Card.get("missing"))

    def test_delete_reports_whether_the_card_existed(self):
        card = Card.create("Doomed", "", "todo")
        self.assertTrue(Card.delete(card["id"]))
        self.assertFalse(Card.delete(card["id"]))

    def test_cards_without_a_position_sort_first(self):
        Card.create("Ordered", "", "todo")
        self.table.put_item(Item={"id": "legacy", "title": "Legacy", "description": "", "status": "todo"})
        self.assertEqual(titles("todo"), ["Legacy", "Ordered"])
        self.assertEqual(Card.create("Newest", "", "todo")["position"], 2 * POSITION_STEP)
